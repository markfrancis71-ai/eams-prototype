import {
  type Entity, type InsertEntity, entities,
  type Relationship, type InsertRelationship, relationships,
  type CompileRecord, type InsertCompileRecord, compile_records,
  type ViewpointDefinition, type InsertViewpoint, viewpoint_definitions,
  type AdvisoryOutput, type InsertAdvisory, advisory_outputs,
  type Branch, type InsertBranch, branches,
  type ComplianceFinding, type InsertComplianceFinding, compliance_findings,
  type Signal, type InsertSignal, signals,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, like, or, inArray, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

export interface IStorage {
  // Entities
  getEntity(eamsId: string, branch?: string): Entity | undefined;
  getEntitiesByDomain(domain: string, kind?: string, status?: string, branch?: string): Entity[];
  getAllEntities(branch?: string): Entity[];
  searchEntities(query: string, filters?: { domain?: string; kind?: string; status?: string; criticality?: string }): Entity[];
  createEntity(entity: InsertEntity): Entity;
  getEntityByTpmId(tpmId: string): Entity | undefined;
  getDomains(): string[];

  // Relationships
  getRelationships(eamsId: string, direction?: string, relType?: string): Relationship[];
  getAllRelationships(branch?: string): Relationship[];
  createRelationship(rel: InsertRelationship): Relationship;
  traverseGraph(fromId: string, depth: number, direction: string, relTypes?: string[]): { nodes: Entity[]; edges: Relationship[] };
  getLineage(eamsId: string, direction: string): { nodes: Entity[]; edges: Relationship[] };

  // Compile Records
  createCompileRecord(record: InsertCompileRecord): CompileRecord;
  getCompileRecords(): CompileRecord[];
  getLatestCompileRecord(branch?: string): CompileRecord | undefined;

  // Viewpoints
  getViewpoints(domain?: string, stakeholder?: string): ViewpointDefinition[];
  getViewpoint(viewpointId: string): ViewpointDefinition | undefined;
  createViewpoint(vp: InsertViewpoint): ViewpointDefinition;
  resolveViewpoint(viewpointId: string, scope: any): any;

  // Advisory
  getAdvisoryOutputs(branch?: string): AdvisoryOutput[];
  getAdvisoryOutput(advisoryId: string): AdvisoryOutput | undefined;
  createAdvisoryOutput(output: InsertAdvisory): AdvisoryOutput;
  acknowledgeAdvisory(advisoryId: string, disposition: string, note: string, by: string): AdvisoryOutput | undefined;

  // Branches
  getBranches(): Branch[];
  getBranch(branchName: string): Branch | undefined;
  createBranch(branch: InsertBranch): Branch;
  getBranchDiff(branchName: string): any;

  // Compliance
  getComplianceFindings(entityId?: string, branch?: string): ComplianceFinding[];
  createComplianceFinding(finding: InsertComplianceFinding): ComplianceFinding;

  // Signals
  getSignals(entityId?: string): Signal[];
  createSignal(signal: InsertSignal): Signal;

  // Context bundle
  getContextBundle(eamsId: string): any;
}

export class DatabaseStorage implements IStorage {
  // ── Entities ──
  getEntity(eamsId: string, branch: string = "main"): Entity | undefined {
    return db.select().from(entities).where(
      and(eq(entities.eams_id, eamsId), eq(entities.branch, branch))
    ).get() || db.select().from(entities).where(eq(entities.eams_id, eamsId)).get();
  }

  getEntitiesByDomain(domain: string, kind?: string, status?: string, branch: string = "main"): Entity[] {
    const conditions = [eq(entities.domain, domain), eq(entities.branch, branch)];
    if (kind) conditions.push(eq(entities.kind, kind));
    if (status) conditions.push(eq(entities.status, status));
    return db.select().from(entities).where(and(...conditions)).all();
  }

  getAllEntities(branch: string = "main"): Entity[] {
    return db.select().from(entities).where(eq(entities.branch, branch)).all();
  }

  searchEntities(query: string, filters?: { domain?: string; kind?: string; status?: string; criticality?: string }): Entity[] {
    const conditions: any[] = [];
    if (query) {
      conditions.push(
        or(
          like(entities.name, `%${query}%`),
          like(entities.description, `%${query}%`),
          like(entities.eams_id, `%${query}%`)
        )
      );
    }
    if (filters?.domain) conditions.push(eq(entities.domain, filters.domain));
    if (filters?.kind) conditions.push(eq(entities.kind, filters.kind));
    if (filters?.status) conditions.push(eq(entities.status, filters.status));
    if (filters?.criticality) conditions.push(eq(entities.criticality, filters.criticality));

    if (conditions.length === 0) return db.select().from(entities).all();
    return db.select().from(entities).where(and(...conditions)).all();
  }

  createEntity(entity: InsertEntity): Entity {
    return db.insert(entities).values(entity).returning().get();
  }

  getEntityByTpmId(tpmId: string): Entity | undefined {
    return db.select().from(entities).where(eq(entities.tpm_id, tpmId)).get();
  }

  getDomains(): string[] {
    const rows = db.selectDistinct({ domain: entities.domain }).from(entities).all();
    return rows.map(r => r.domain);
  }

  // ── Relationships ──
  getRelationships(eamsId: string, direction?: string, relType?: string): Relationship[] {
    let results: Relationship[] = [];
    if (!direction || direction === "outbound" || direction === "both") {
      const conds: any[] = [eq(relationships.from_entity_id, eamsId)];
      if (relType) conds.push(eq(relationships.rel_type, relType));
      results = results.concat(db.select().from(relationships).where(and(...conds)).all());
    }
    if (!direction || direction === "inbound" || direction === "both") {
      const conds: any[] = [eq(relationships.to_entity_id, eamsId)];
      if (relType) conds.push(eq(relationships.rel_type, relType));
      results = results.concat(db.select().from(relationships).where(and(...conds)).all());
    }
    // deduplicate
    const seen = new Set<number>();
    return results.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  }

  getAllRelationships(branch: string = "main"): Relationship[] {
    return db.select().from(relationships).where(eq(relationships.branch, branch)).all();
  }

  createRelationship(rel: InsertRelationship): Relationship {
    return db.insert(relationships).values(rel).returning().get();
  }

  traverseGraph(fromId: string, depth: number, direction: string, relTypes?: string[]): { nodes: Entity[]; edges: Relationship[] } {
    const visitedNodes = new Set<string>();
    const collectedEdges: Relationship[] = [];
    const queue: { id: string; d: number }[] = [{ id: fromId, d: 0 }];
    visitedNodes.add(fromId);

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      if (d >= depth) continue;

      const rels = this.getRelationships(id, direction === "both" ? undefined : direction);
      for (const rel of rels) {
        if (relTypes && relTypes.length > 0 && !relTypes.includes(rel.rel_type)) continue;
        collectedEdges.push(rel);
        const nextId = rel.from_entity_id === id ? rel.to_entity_id : rel.from_entity_id;
        if (!visitedNodes.has(nextId)) {
          visitedNodes.add(nextId);
          queue.push({ id: nextId, d: d + 1 });
        }
      }
    }

    const nodeIds = Array.from(visitedNodes);
    const nodes: Entity[] = [];
    for (const nid of nodeIds) {
      const e = this.getEntity(nid);
      if (e) nodes.push(e);
    }

    // deduplicate edges
    const edgeSet = new Set<number>();
    const uniqueEdges = collectedEdges.filter(e => { if (edgeSet.has(e.id)) return false; edgeSet.add(e.id); return true; });

    return { nodes, edges: uniqueEdges };
  }

  getLineage(eamsId: string, direction: string): { nodes: Entity[]; edges: Relationship[] } {
    const lineageRelTypes = ["container_of", "realized_by", "supported_by"];
    return this.traverseGraph(eamsId, 10, direction === "up" ? "inbound" : "outbound", lineageRelTypes);
  }

  // ── Compile Records ──
  createCompileRecord(record: InsertCompileRecord): CompileRecord {
    return db.insert(compile_records).values(record).returning().get();
  }

  getCompileRecords(): CompileRecord[] {
    return db.select().from(compile_records).all();
  }

  getLatestCompileRecord(branch: string = "main"): CompileRecord | undefined {
    return db.select().from(compile_records).where(eq(compile_records.branch, branch)).all().pop();
  }

  // ── Viewpoints ──
  getViewpoints(domain?: string, stakeholder?: string): ViewpointDefinition[] {
    const all = db.select().from(viewpoint_definitions).all();
    return all.filter(vp => {
      if (stakeholder) {
        const sh = JSON.parse(vp.stakeholders || "[]");
        if (!sh.includes(stakeholder)) return false;
      }
      return true;
    });
  }

  getViewpoint(viewpointId: string): ViewpointDefinition | undefined {
    return db.select().from(viewpoint_definitions).where(eq(viewpoint_definitions.viewpoint_id, viewpointId)).get();
  }

  createViewpoint(vp: InsertViewpoint): ViewpointDefinition {
    return db.insert(viewpoint_definitions).values(vp).returning().get();
  }

  resolveViewpoint(viewpointId: string, scope: any): any {
    const vp = this.getViewpoint(viewpointId);
    if (!vp) return null;

    const scopeConfig = JSON.parse(vp.scope_config || "{}");
    const includeRules = JSON.parse(vp.include_rules || "[]");
    const styling = JSON.parse(vp.styling || "{}");
    const layout = JSON.parse(vp.layout || "{}");
    const filters = JSON.parse(vp.filters || "{}");

    let seedEntities: Entity[] = [];
    const branch = scope.branch || "main";

    // Resolve seed entities based on scope strategy
    if (vp.scope_strategy === "parameter-seed" && scope.entity_id) {
      const seed = this.getEntity(scope.entity_id, branch);
      if (seed) seedEntities = [seed];
    } else if (vp.scope_strategy === "domain-query" && scope.domain) {
      seedEntities = this.getEntitiesByDomain(scope.domain, undefined, undefined, branch);
    } else if (vp.scope_strategy === "entity-query") {
      seedEntities = this.getAllEntities(branch);
    }

    // Apply include rules to expand the graph
    const allNodes = new Map<string, Entity>();
    const allEdges: Relationship[] = [];

    for (const entity of seedEntities) {
      allNodes.set(entity.eams_id, entity);
    }

    // Expand based on include rules
    for (const rule of includeRules) {
      const currentIds = Array.from(allNodes.keys());
      for (const id of currentIds) {
        const rels = this.getRelationships(id);
        for (const rel of rels) {
          if (rule.rel_types && !rule.rel_types.includes(rel.rel_type)) continue;
          allEdges.push(rel);
          const otherId = rel.from_entity_id === id ? rel.to_entity_id : rel.from_entity_id;
          if (!allNodes.has(otherId)) {
            const e = this.getEntity(otherId, branch);
            if (e) {
              if (rule.kinds && !rule.kinds.includes(e.kind)) continue;
              allNodes.set(otherId, e);
            }
          }
        }
      }
    }

    // If no include rules, just get all relationships between seed entities
    if (includeRules.length === 0) {
      const ids = Array.from(allNodes.keys());
      for (const id of ids) {
        const rels = this.getRelationships(id);
        for (const rel of rels) {
          if (allNodes.has(rel.from_entity_id) && allNodes.has(rel.to_entity_id)) {
            allEdges.push(rel);
          }
          // Also add connected nodes for parameter-seed viewpoints
          if (vp.scope_strategy === "parameter-seed") {
            const otherId = rel.from_entity_id === id ? rel.to_entity_id : rel.from_entity_id;
            if (!allNodes.has(otherId)) {
              const e = this.getEntity(otherId, branch);
              if (e) allNodes.set(otherId, e);
            }
            allEdges.push(rel);
          }
        }
      }
    }

    // Apply filters
    if (filters.kinds) {
      for (const [id, e] of allNodes) {
        if (!filters.kinds.includes(e.kind)) allNodes.delete(id);
      }
    }
    if (filters.statuses) {
      for (const [id, e] of allNodes) {
        if (!filters.statuses.includes(e.status)) allNodes.delete(id);
      }
    }

    // Deduplicate edges
    const edgeSet = new Set<string>();
    const uniqueEdges = allEdges.filter(e => {
      const key = `${e.from_entity_id}-${e.to_entity_id}-${e.rel_type}`;
      if (edgeSet.has(key)) return false;
      edgeSet.add(key);
      // Only include edges where both endpoints exist
      return allNodes.has(e.from_entity_id) && allNodes.has(e.to_entity_id);
    });

    // Build canonical render graph
    const nodeColors: Record<string, string> = {
      system: "#1B3A5C",
      container: "#0F7173",
      capability: "#6B4C9A",
      process: "#2D6A4F",
      data_entity: "#7C5E3C",
      data_product: "#8B6914",
      actor: "#4A5568",
      goal: "#2563EB",
      decision: "#D97706",
      standard: "#6D28D9",
      infrastructure: "#374151",
    };

    const nodeShapes: Record<string, string> = {
      actor: "person",
      system: "box",
      container: "box",
      capability: "hexagon",
      process: "diamond",
      data_entity: "cylinder",
      data_product: "cylinder",
      goal: "triangle",
      decision: "note",
      standard: "shield",
      infrastructure: "cloud",
    };

    const renderNodes = Array.from(allNodes.values()).map(e => ({
      id: e.eams_id,
      kind: e.kind,
      name: e.name,
      role: e.kind,
      labels: {
        primary: e.name,
        secondary: e.technology_primary || e.kind,
        domain: e.domain,
      },
      display: {
        shape: nodeShapes[e.kind] || "box",
        color: nodeColors[e.kind] || "#475569",
        badges: [
          e.status !== "active" ? e.status : null,
          e.criticality || null,
          e.compliance_status === "violation" ? "violation" : null,
        ].filter(Boolean),
        dashed: e.status === "deprecated" || e.status === "retired",
      },
      data: {
        eams_id: e.eams_id,
        domain: e.domain,
        status: e.status,
        criticality: e.criticality,
        description: e.description,
        technology: e.technology_primary,
      },
    }));

    const renderEdges = uniqueEdges.map(r => ({
      from: r.from_entity_id,
      to: r.to_entity_id,
      rel_type: r.rel_type,
      labels: {
        primary: r.description || r.rel_type,
        protocol: r.protocol || "",
      },
      display: {
        style: r.criticality === "synchronous-critical" ? "solid" : "dashed",
        weight: r.criticality === "synchronous-critical" ? 3 : 1,
        color: r.criticality === "synchronous-critical" ? "#EF4444" : "#64748B",
        animated: r.criticality === "async",
      },
    }));

    // Build groups from parent systems
    const groups: any[] = [];
    const systemNodes = renderNodes.filter(n => n.kind === "system");
    for (const sys of systemNodes) {
      const children = renderNodes.filter(n => {
        const entity = allNodes.get(n.id);
        return entity?.parent_system_id === sys.id;
      });
      if (children.length > 0) {
        groups.push({
          id: `group-${sys.id}`,
          label: sys.name,
          members: children.map(c => c.id),
          color: sys.display.color + "33",
        });
      }
    }

    return {
      viewpoint: {
        id: vp.viewpoint_id,
        name: vp.name,
        description: vp.description,
      },
      scope: scope,
      render_graph: {
        nodes: renderNodes,
        edges: renderEdges,
        groups,
        layout: layout,
        metadata: {
          generated_at: new Date().toISOString(),
          node_count: renderNodes.length,
          edge_count: renderEdges.length,
        },
      },
    };
  }

  // ── Advisory ──
  getAdvisoryOutputs(branch?: string): AdvisoryOutput[] {
    if (branch) return db.select().from(advisory_outputs).where(eq(advisory_outputs.branch, branch)).all();
    return db.select().from(advisory_outputs).all();
  }

  getAdvisoryOutput(advisoryId: string): AdvisoryOutput | undefined {
    return db.select().from(advisory_outputs).where(eq(advisory_outputs.advisory_id, advisoryId)).get();
  }

  createAdvisoryOutput(output: InsertAdvisory): AdvisoryOutput {
    return db.insert(advisory_outputs).values(output).returning().get();
  }

  acknowledgeAdvisory(advisoryId: string, disposition: string, note: string, by: string): AdvisoryOutput | undefined {
    db.update(advisory_outputs).set({
      status: "acknowledged",
      disposition,
      disposition_note: note,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: by,
    }).where(eq(advisory_outputs.advisory_id, advisoryId)).run();
    return this.getAdvisoryOutput(advisoryId);
  }

  // ── Branches ──
  getBranches(): Branch[] {
    return db.select().from(branches).all();
  }

  getBranch(branchName: string): Branch | undefined {
    return db.select().from(branches).where(eq(branches.branch_name, branchName)).get();
  }

  createBranch(branch: InsertBranch): Branch {
    return db.insert(branches).values(branch).returning().get();
  }

  getBranchDiff(branchName: string): any {
    const branchEntities = db.select().from(entities).where(eq(entities.branch, branchName)).all();
    const mainEntities = db.select().from(entities).where(eq(entities.branch, "main")).all();
    const mainMap = new Map(mainEntities.map(e => [e.eams_id, e]));

    const added: Entity[] = [];
    const modified: Entity[] = [];
    for (const be of branchEntities) {
      const mainE = mainMap.get(be.eams_id);
      if (!mainE) {
        added.push(be);
      } else if (be.content_hash !== mainE.content_hash) {
        modified.push(be);
      }
    }

    const branchIds = new Set(branchEntities.map(e => e.eams_id));
    const removed = mainEntities.filter(e => !branchIds.has(e.eams_id) && e.branch === "main");

    return {
      branch: branchName,
      added: added.map(e => ({ eams_id: e.eams_id, name: e.name, kind: e.kind })),
      modified: modified.map(e => ({ eams_id: e.eams_id, name: e.name, kind: e.kind, changes: [] })),
      removed: removed.slice(0, 3).map(e => ({ eams_id: e.eams_id, name: e.name, kind: e.kind })),
      summary: { added: added.length, modified: modified.length, removed: 0 },
    };
  }

  // ── Compliance Findings ──
  getComplianceFindings(entityId?: string, branch?: string): ComplianceFinding[] {
    const conditions: any[] = [];
    if (entityId) conditions.push(eq(compliance_findings.entity_id, entityId));
    if (branch) conditions.push(eq(compliance_findings.branch, branch));
    if (conditions.length === 0) return db.select().from(compliance_findings).all();
    return db.select().from(compliance_findings).where(and(...conditions)).all();
  }

  createComplianceFinding(finding: InsertComplianceFinding): ComplianceFinding {
    return db.insert(compliance_findings).values(finding).returning().get();
  }

  // ── Signals ──
  getSignals(entityId?: string): Signal[] {
    if (entityId) {
      // Search in affected_entities JSON array
      return db.select().from(signals).all().filter(s => {
        const affected = JSON.parse(s.affected_entities || "[]");
        return affected.includes(entityId);
      });
    }
    return db.select().from(signals).all();
  }

  createSignal(signal: InsertSignal): Signal {
    return db.insert(signals).values(signal).returning().get();
  }

  // ── Context Bundle ──
  getContextBundle(eamsId: string): any {
    const entity = this.getEntity(eamsId);
    if (!entity) return null;

    const rels = this.getRelationships(eamsId);
    const findings = this.getComplianceFindings(eamsId);
    const entitySignals = this.getSignals(eamsId);

    // Get related standards
    const standardIds = findings.map(f => f.standard_id);
    const standards = standardIds.length > 0
      ? [...new Set(standardIds)].map(sid => this.getEntity(sid)).filter(Boolean)
      : [];

    // Get related decisions
    const relatedDecisionRels = rels.filter(r => {
      const otherId = r.from_entity_id === eamsId ? r.to_entity_id : r.from_entity_id;
      const other = this.getEntity(otherId);
      return other?.kind === "decision";
    });
    const decisions = relatedDecisionRels.map(r => {
      const otherId = r.from_entity_id === eamsId ? r.to_entity_id : r.from_entity_id;
      return this.getEntity(otherId);
    }).filter(Boolean);

    return {
      entity,
      relationships: rels,
      compliance_findings: findings,
      standards,
      decisions,
      signals: entitySignals,
      _meta: {
        generated_at: new Date().toISOString(),
        relationship_count: rels.length,
        finding_count: findings.length,
      },
    };
  }
}

export const storage = new DatabaseStorage();
