import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { db } from "./storage";
import * as schema from "@shared/schema";
import fs from "fs";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Run seed on startup
  seedDatabase();

  // ── Entity Endpoints ─────────────────────────────────────

  // MUST come before :eams_id to avoid being swallowed
  app.get("/api/entities/lookup", (req, res) => {
    const { tpm_id, name, eams_id } = req.query;
    if (tpm_id) {
      const entity = storage.getEntityByTpmId(tpm_id as string);
      return entity ? res.json(entity) : res.status(404).json({ error: "Not found" });
    }
    if (eams_id) {
      const entity = storage.getEntity(eams_id as string);
      return entity ? res.json(entity) : res.status(404).json({ error: "Not found" });
    }
    if (name) {
      const results = storage.searchEntities(name as string);
      return res.json(results);
    }
    return res.status(400).json({ error: "Provide tpm_id, name, or eams_id" });
  });

  app.get("/api/entities/:eams_id/context-bundle", (req, res) => {
    const eamsId = req.params.eams_id;
    const bundle = storage.getContextBundle(eamsId);
    if (!bundle) return res.status(404).json({ error: "Entity not found" });
    return res.json(bundle);
  });

  app.get("/api/entities/:eams_id/relationships", (req, res) => {
    const eamsId = req.params.eams_id;
    const direction = req.query.direction as string | undefined;
    const relType = req.query.rel_type as string | undefined;
    const rels = storage.getRelationships(eamsId, direction, relType);
    // Enrich with entity names
    const enriched = rels.map(r => {
      const fromEntity = storage.getEntity(r.from_entity_id);
      const toEntity = storage.getEntity(r.to_entity_id);
      return {
        ...r,
        from_entity_name: fromEntity?.name || r.from_entity_id,
        from_entity_kind: fromEntity?.kind,
        to_entity_name: toEntity?.name || r.to_entity_id,
        to_entity_kind: toEntity?.kind,
      };
    });
    return res.json(enriched);
  });

  app.get("/api/entities/:eams_id/context-bundle", (req, res) => {
    const eamsId = req.params.eams_id;
    const bundle = storage.getContextBundle(eamsId);
    if (!bundle) return res.status(404).json({ error: "Entity not found" });
    return res.json(bundle);
  });

  // Single entity by ID (must come AFTER /lookup, /relationships, /context-bundle)
  app.get("/api/entities/:eams_id", (req, res) => {
    const eamsId = req.params.eams_id;
    const branch = (req.query.branch as string) || "main";
    const entity = storage.getEntity(eamsId, branch);
    if (!entity) return res.status(404).json({ error: "Entity not found" });
    const findings = storage.getComplianceFindings(eamsId);
    return res.json({
      ...entity,
      _meta: { compliance_findings_count: findings.length, fetched_at: new Date().toISOString() }
    });
  });

  // ── Domain Endpoints ─────────────────────────────────────

  app.get("/api/domains", (_req, res) => {
    const domains = storage.getDomains();
    return res.json(domains);
  });

  app.get("/api/domains/:domain/entities", (req, res) => {
    const { domain } = req.params;
    const kind = req.query.kind as string | undefined;
    const status = req.query.status as string | undefined;
    const branch = (req.query.branch as string) || "main";
    const entities = storage.getEntitiesByDomain(domain, kind, status, branch);
    return res.json(entities);
  });

  // ── Graph Traversal ──────────────────────────────────────

  app.get("/api/graph/traverse", (req, res) => {
    const fromId = req.query.from as string;
    const depth = parseInt(req.query.depth as string) || 2;
    const direction = (req.query.direction as string) || "both";
    const relTypesStr = req.query.rel_types as string;
    const relTypes = relTypesStr ? relTypesStr.split(",") : undefined;

    if (!fromId) return res.status(400).json({ error: "from parameter required" });

    const result = storage.traverseGraph(fromId, depth, direction, relTypes);
    return res.json(result);
  });

  app.get("/api/graph/lineage/:eams_id", (req, res) => {
    const eamsId = req.params.eams_id;
    const direction = (req.query.direction as string) || "up";
    const result = storage.getLineage(eamsId, direction);
    return res.json(result);
  });

  // ── Viewpoints ───────────────────────────────────────────

  app.get("/api/viewpoints", (req, res) => {
    const domain = req.query.domain as string | undefined;
    const stakeholder = req.query.stakeholder as string | undefined;
    const viewpoints = storage.getViewpoints(domain, stakeholder);
    return res.json(viewpoints);
  });

  app.get("/api/viewpoints/:viewpoint_id", (req, res) => {
    const vp = storage.getViewpoint(req.params.viewpoint_id);
    if (!vp) return res.status(404).json({ error: "Viewpoint not found" });
    return res.json(vp);
  });

  app.get("/api/viewpoints/:viewpoint_id/resolve", (req, res) => {
    const viewpointId = req.params.viewpoint_id;
    const scope: any = {};
    if (req.query.entity_id) scope.entity_id = req.query.entity_id;
    if (req.query.scope_system) scope.entity_id = req.query.scope_system;
    if (req.query.scope_domain) scope.domain = req.query.scope_domain;
    if (req.query.scope_entities) scope.entity_id = req.query.scope_entities;
    if (req.query.domain) scope.domain = req.query.domain;
    if (req.query.branch) scope.branch = req.query.branch;

    const result = storage.resolveViewpoint(viewpointId, scope);
    if (!result) return res.status(404).json({ error: "Viewpoint not found or resolution failed" });
    return res.json(result);
  });

  // ── Search ───────────────────────────────────────────────

  app.get("/api/search", (req, res) => {
    const q = (req.query.q as string) || "";
    const filters = {
      domain: req.query.domain as string | undefined,
      kind: req.query.kind as string | undefined,
      status: req.query.status as string | undefined,
      criticality: req.query.criticality as string | undefined,
    };
    const results = storage.searchEntities(q, filters);
    return res.json(results);
  });

  // ── Branches & Diff ──────────────────────────────────────

  app.get("/api/branches", (_req, res) => {
    const branchList = storage.getBranches();
    return res.json(branchList);
  });

  app.get("/api/branches/:branch_name", (req, res) => {
    const branch = storage.getBranch(req.params.branch_name);
    if (!branch) return res.status(404).json({ error: "Branch not found" });
    return res.json(branch);
  });

  app.get("/api/diff/:branch", (req, res) => {
    const branchName = decodeURIComponent(req.params.branch);
    const diff = storage.getBranchDiff(branchName);
    return res.json(diff);
  });

  // ── Compile ──────────────────────────────────────────────

  app.post("/api/compile", (req, res) => {
    const branch = req.body?.branch || "main";
    const allEntities = storage.getAllEntities(branch);
    const allFindings = storage.getComplianceFindings(undefined, branch);

    const violations = allFindings.filter(f => f.severity === "violation").length;
    const warnings = allFindings.filter(f => f.severity === "warning").length;
    const blocked = allEntities.filter(e => e.compliance_status === "violation");

    const compileId = `compile-${Date.now()}`;
    const record = storage.createCompileRecord({
      compile_id: compileId,
      branch,
      git_sha: Math.random().toString(36).substring(2, 14),
      trigger: "manual",
      outcome: violations > 0 ? "partial_success" : "success",
      entities_total: allEntities.length,
      entities_passed: allEntities.length - blocked.length,
      entities_blocked: blocked.length,
      diff_added: 0,
      diff_modified: 0,
      diff_removed: 0,
      errors: JSON.stringify([]),
      compliance_findings: JSON.stringify({ violations, warnings, advisories: allFindings.length - violations - warnings }),
      blocked_entities: JSON.stringify(blocked.map(e => e.eams_id)),
      stage_timings: JSON.stringify({
        parse: Math.floor(Math.random() * 100) + 80,
        validate: Math.floor(Math.random() * 200) + 200,
        normalize: Math.floor(Math.random() * 50) + 60,
        resolve: Math.floor(Math.random() * 150) + 150,
        compile: Math.floor(Math.random() * 300) + 300,
        compliance: Math.floor(Math.random() * 100) + 100,
        diff: Math.floor(Math.random() * 80) + 50,
        publish: Math.floor(Math.random() * 40) + 30,
      }),
      started_at: new Date().toISOString(),
      completed_at: new Date(Date.now() + 2000).toISOString(),
    });

    return res.json(record);
  });

  app.get("/api/compile/status", (_req, res) => {
    const latest = storage.getLatestCompileRecord();
    if (!latest) return res.json({ status: "none", message: "No compile records" });
    return res.json({
      status: latest.outcome,
      compile_id: latest.compile_id,
      branch: latest.branch,
      completed_at: latest.completed_at,
      entities_total: latest.entities_total,
      entities_passed: latest.entities_passed,
    });
  });

  app.get("/api/compile/records", (_req, res) => {
    const records = storage.getCompileRecords();
    return res.json(records);
  });

  // ── Advisory ─────────────────────────────────────────────

  app.get("/api/advisory", (req, res) => {
    const branch = req.query.branch as string | undefined;
    const outputs = storage.getAdvisoryOutputs(branch);
    return res.json(outputs);
  });

  app.get("/api/advisory/:advisory_id", (req, res) => {
    const output = storage.getAdvisoryOutput(req.params.advisory_id);
    if (!output) return res.status(404).json({ error: "Advisory not found" });
    return res.json(output);
  });

  app.post("/api/advisory/request", (req, res) => {
    const { entity_id, output_type, scope_mode } = req.body;
    const entity = storage.getEntity(entity_id);

    const advisoryId = `advisory-${Date.now()}`;
    const output = storage.createAdvisoryOutput({
      advisory_id: advisoryId,
      output_type: output_type || "compliance_assessment",
      scope_entity_id: entity_id,
      scope_mode: scope_mode || "entity",
      branch: "main",
      status: "completed",
      model_tier: "tier-2",
      content: JSON.stringify({
        summary: `Analysis of ${entity?.name || entity_id}`,
        findings: [
          { category: "Architecture", severity: "advisory", detail: `${entity?.name || "Entity"} follows current architectural patterns with minor improvement opportunities.` },
          { category: "Performance", severity: "advisory", detail: "NFR profile appears adequate for current load. Consider load testing for projected 2027 volumes." },
        ],
        recommendations: [
          "Review NFR profile against projected growth",
          "Update architecture documentation to reflect recent changes",
        ],
      }),
      data_gaps: JSON.stringify(["Recent load test results unavailable"]),
      generated_at: new Date().toISOString(),
    });

    return res.json(output);
  });

  app.post("/api/advisory/:advisory_id/acknowledge", (req, res) => {
    const { disposition, note, by } = req.body;
    const result = storage.acknowledgeAdvisory(
      req.params.advisory_id,
      disposition || "noted",
      note || "",
      by || "user@company.com"
    );
    if (!result) return res.status(404).json({ error: "Advisory not found" });
    return res.json(result);
  });

  // ── DSL Management ───────────────────────────────────────

  const dslDir = path.join(process.cwd(), "dsl");

  // Ensure DSL directory exists with sample files
  if (!fs.existsSync(dslDir)) {
    fs.mkdirSync(dslDir, { recursive: true });
    fs.mkdirSync(path.join(dslDir, "claims"), { recursive: true });
    fs.mkdirSync(path.join(dslDir, "policy"), { recursive: true });
    fs.mkdirSync(path.join(dslDir, "billing"), { recursive: true });

    fs.writeFileSync(path.join(dslDir, "claims", "systems.yaml"), `# Claims Domain — Systems
domain: claims

systems:
  - eams_id: system.claims-processing
    name: Claims Processing System
    status: active
    criticality: tier-1
    technology:
      primary: Java/Spring Boot
      language: Java 17
      framework: Spring Boot 3.2
      runtime: JVM 17
      hosting: AWS ECS Fargate
    nfr:
      availability: "99.95%"
      throughput: "500 claims/min"
      latency: "p99 < 200ms"
      data_classification: pii
    ownership:
      architect: Sarah Chen
      business_owner: Mike Rodriguez

  - eams_id: system.claims-portal
    name: Claims Portal
    status: active
    criticality: tier-1
    technology:
      primary: React/Node.js
      language: TypeScript
      framework: Next.js 14

  - eams_id: system.claims-data-platform
    name: Claims Data Platform
    status: active
    criticality: tier-2
    technology:
      primary: Snowflake/dbt
`);

    fs.writeFileSync(path.join(dslDir, "claims", "containers.yaml"), `# Claims Domain — Containers
domain: claims

containers:
  - eams_id: container.adjudication-api
    name: Adjudication API
    parent_system: system.claims-processing
    container_type: api
    technology:
      primary: Java/Spring Boot
      language: Java 17
    nfr:
      latency: "p99 < 150ms"
      throughput: "200 req/s"

  - eams_id: container.rules-engine
    name: Rules Engine
    parent_system: system.claims-processing
    container_type: worker
    technology:
      primary: Drools
      framework: Drools 8.x

  - eams_id: container.claims-database
    name: Claims Database
    parent_system: system.claims-processing
    container_type: database
    technology:
      primary: Aurora PostgreSQL
`);

    fs.writeFileSync(path.join(dslDir, "claims", "relationships.yaml"), `# Claims Domain — Relationships
domain: claims

relationships:
  - from: container.adjudication-api
    to: container.rules-engine
    type: uses
    criticality: synchronous-critical
    protocol: gRPC
    description: Evaluates claim rules

  - from: container.adjudication-api
    to: container.claims-database
    type: stores_in
    criticality: synchronous-critical
    protocol: PostgreSQL
    description: Reads/writes claim data

  - from: container.adjudication-api
    to: container.event-router
    type: publishes_to
    criticality: async
    protocol: Kafka
    description: Publishes adjudication events
`);

    fs.writeFileSync(path.join(dslDir, "policy", "systems.yaml"), `# Policy Domain — Systems
domain: policy

systems:
  - eams_id: system.policy-admin
    name: Policy Admin System
    status: active
    criticality: tier-1
    technology:
      primary: Java/Spring Boot

  - eams_id: system.policy-rating-engine
    name: Policy Rating Engine
    status: active
    criticality: tier-1
    technology:
      primary: Go
`);

    fs.writeFileSync(path.join(dslDir, "billing", "systems.yaml"), `# Billing Domain — Systems
domain: billing

systems:
  - eams_id: system.billing
    name: Billing System
    status: active
    criticality: tier-1

  - eams_id: system.payment-gateway
    name: Payment Gateway
    status: active
    criticality: tier-1
`);
  }

  app.get("/api/dsl/files", (_req, res) => {
    function walkDir(dir: string, prefix: string = ""): any[] {
      const results: any[] = [];
      if (!fs.existsSync(dir)) return results;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          results.push({ path: relPath, type: "directory", children: walkDir(path.join(dir, entry.name), relPath) });
        } else {
          const stat = fs.statSync(path.join(dir, entry.name));
          results.push({ path: relPath, type: "file", size: stat.size, modified: stat.mtime.toISOString() });
        }
      }
      return results;
    }
    return res.json(walkDir(dslDir));
  });

  app.get("/api/dsl/files/{*path}", (req, res) => {
    const filePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
    const fullPath = path.join(dslDir, filePath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "File not found" });
    const content = fs.readFileSync(fullPath, "utf-8");
    return res.json({ path: filePath, content });
  });

  app.put("/api/dsl/files/{*path}", (req, res) => {
    const filePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
    const fullPath = path.join(dslDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, req.body.content || "");
    return res.json({ path: filePath, status: "saved" });
  });

  app.post("/api/dsl/validate", (req, res) => {
    const { content, path: filePath } = req.body;
    const errors: any[] = [];

    if (!content) {
      errors.push({ line: 0, message: "Empty content", severity: "error" });
      return res.json({ valid: false, errors });
    }

    // Basic YAML validation
    try {
      const lines = content.split("\n");
      let indent = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === "" || line.trim().startsWith("#")) continue;

        // Check for tabs
        if (line.includes("\t")) {
          errors.push({ line: i + 1, message: "Tab characters not allowed in YAML", severity: "error" });
        }

        // Check required fields for systems
        if (line.trim() === "systems:" || line.trim() === "containers:" || line.trim() === "relationships:") {
          // Valid section header
        }
      }

      // Check for required domain field
      if (!content.includes("domain:")) {
        errors.push({ line: 1, message: "Missing required 'domain' field", severity: "warning" });
      }
    } catch (e: any) {
      errors.push({ line: 0, message: `Parse error: ${e.message}`, severity: "error" });
    }

    return res.json({
      valid: errors.filter(e => e.severity === "error").length === 0,
      errors,
      file: filePath,
    });
  });

  // ── Signals ─────────────────────────────────────────────

  app.get("/api/signals", (_req, res) => {
    const allSignals = storage.getSignals();
    return res.json(allSignals);
  });

  // ── Artifact Generation ────────────────────────────────

  app.post("/api/artifacts/generate", (req, res) => {
    const { entity_id, template } = req.body;
    const jobId = `job-${Date.now()}`;

    if (!entity_id || !template) {
      return res.status(400).json({ error: "entity_id and template are required" });
    }

    const entity = storage.getEntity(entity_id);
    if (!entity) {
      return res.status(404).json({ error: "Entity not found" });
    }

    const rels = storage.getRelationships(entity_id);
    const findings = storage.getComplianceFindings(entity_id);
    const entitySignals = storage.getSignals(entity_id);

    // Enrich relationships with entity names
    const enrichedRels = rels.map(r => {
      const fromE = storage.getEntity(r.from_entity_id);
      const toE = storage.getEntity(r.to_entity_id);
      return { ...r, from_name: fromE?.name || r.from_entity_id, to_name: toE?.name || r.to_entity_id, from_kind: fromE?.kind, to_kind: toE?.kind };
    });

    const outbound = enrichedRels.filter(r => r.from_entity_id === entity_id);
    const inbound = enrichedRels.filter(r => r.to_entity_id === entity_id);
    const now = new Date().toISOString();

    var html = "";

    if (template === "system-overview") {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>System Overview: ${entity.name}</title>
<style>
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 40px; line-height: 1.6; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { color: #F1F5F9; font-size: 24px; margin-bottom: 4px; }
  h2 { color: #0F7173; font-size: 18px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; margin-top: 32px; }
  .subtitle { color: #94A3B8; font-size: 14px; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-right: 6px; }
  .badge-kind { background: #1E293B; color: #0F7173; border: 1px solid #0F7173; }
  .badge-status { background: #1E293B; color: #10B981; border: 1px solid #10B981; }
  .badge-critical { background: #1E293B; color: #F59E0B; border: 1px solid #F59E0B; }
  .section { background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-top: 16px; }
  .row { display: flex; padding: 6px 0; border-bottom: 1px solid #334155; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .label { width: 180px; color: #94A3B8; flex-shrink: 0; }
  .value { color: #E2E8F0; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
  .finding { padding: 12px; border: 1px solid #334155; border-radius: 6px; margin-top: 8px; }
  .finding-violation { border-color: #EF4444; }
  .finding-warning { border-color: #F59E0B; }
  .finding-advisory { border-color: #3B82F6; }
  .severity { font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 3px; }
  .sev-violation { background: #EF4444/15; color: #EF4444; }
  .sev-warning { background: #F59E0B/15; color: #F59E0B; }
  .sev-advisory { background: #3B82F6/15; color: #3B82F6; }
  .rel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .rel-table th { text-align: left; color: #94A3B8; padding: 6px 8px; border-bottom: 1px solid #334155; font-weight: 500; }
  .rel-table td { padding: 6px 8px; border-bottom: 1px solid #334155/50; }
  .signal { padding: 10px; border: 1px solid #334155; border-radius: 6px; margin-top: 8px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #334155; color: #64748B; font-size: 12px; text-align: center; }
</style></head><body><div class="container">
  <h1>${entity.name}</h1>
  <div class="subtitle">${entity.domain} domain · ${entity.eams_id}</div>
  <div><span class="badge badge-kind">${entity.kind}</span><span class="badge badge-status">${entity.status}</span>${entity.criticality ? `<span class="badge badge-critical">${entity.criticality}</span>` : ""}</div>
  ${entity.description ? `<p style="color:#CBD5E1;font-size:14px;margin-top:16px;">${entity.description}</p>` : ""}
  <h2>Ownership &amp; Metadata</h2><div class="section">
    ${entity.ownership_architect ? `<div class="row"><span class="label">Architect</span><span class="value">${entity.ownership_architect}</span></div>` : ""}
    ${entity.ownership_business_owner ? `<div class="row"><span class="label">Business Owner</span><span class="value">${entity.ownership_business_owner}</span></div>` : ""}
    ${entity.criticality ? `<div class="row"><span class="label">Criticality</span><span class="value">${entity.criticality}</span></div>` : ""}
    ${entity.lifecycle ? `<div class="row"><span class="label">Lifecycle</span><span class="value">${entity.lifecycle}</span></div>` : ""}
    ${entity.tpm_id ? `<div class="row"><span class="label">TPM ID</span><span class="value">${entity.tpm_id}</span></div>` : ""}
    ${entity.metadata_created ? `<div class="row"><span class="label">Created</span><span class="value">${entity.metadata_created}</span></div>` : ""}
    ${entity.metadata_last_reviewed ? `<div class="row"><span class="label">Last Reviewed</span><span class="value">${entity.metadata_last_reviewed}</span></div>` : ""}
  </div>
  <h2>Technology Stack</h2><div class="section">
    ${entity.technology_primary ? `<div class="row"><span class="label">Primary</span><span class="value">${entity.technology_primary}</span></div>` : ""}
    ${entity.technology_language ? `<div class="row"><span class="label">Language</span><span class="value">${entity.technology_language}</span></div>` : ""}
    ${entity.technology_framework ? `<div class="row"><span class="label">Framework</span><span class="value">${entity.technology_framework}</span></div>` : ""}
    ${entity.technology_runtime ? `<div class="row"><span class="label">Runtime</span><span class="value">${entity.technology_runtime}</span></div>` : ""}
    ${entity.technology_hosting ? `<div class="row"><span class="label">Hosting</span><span class="value">${entity.technology_hosting}</span></div>` : ""}
  </div>
  <h2>NFR Profile</h2><div class="section">
    ${entity.nfr_availability ? `<div class="row"><span class="label">Availability</span><span class="value">${entity.nfr_availability}</span></div>` : ""}
    ${entity.nfr_throughput ? `<div class="row"><span class="label">Throughput</span><span class="value">${entity.nfr_throughput}</span></div>` : ""}
    ${entity.nfr_latency ? `<div class="row"><span class="label">Latency</span><span class="value">${entity.nfr_latency}</span></div>` : ""}
    ${entity.nfr_data_classification ? `<div class="row"><span class="label">Data Classification</span><span class="value">${entity.nfr_data_classification}</span></div>` : ""}
    ${entity.nfr_encryption ? `<div class="row"><span class="label">Encryption</span><span class="value">${entity.nfr_encryption}</span></div>` : ""}
    ${entity.nfr_retention ? `<div class="row"><span class="label">Retention</span><span class="value">${entity.nfr_retention}</span></div>` : ""}
  </div>
  <h2>Related Entities (${enrichedRels.length})</h2><div class="section">
    ${enrichedRels.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No relationships</p>" : `<table class="rel-table"><thead><tr><th>Direction</th><th>Type</th><th>Entity</th><th>Protocol</th></tr></thead><tbody>
    ${outbound.map(r => `<tr><td style="color:#0F7173;">outbound</td><td>${r.rel_type}</td><td>${r.to_name}</td><td style="color:#94A3B8;">${r.protocol || "—"}</td></tr>`).join("")}
    ${inbound.map(r => `<tr><td style="color:#94A3B8;">inbound</td><td>${r.rel_type}</td><td>${r.from_name}</td><td style="color:#94A3B8;">${r.protocol || "—"}</td></tr>`).join("")}
    </tbody></table>`}
  </div>
  <h2>Compliance Status (${findings.length} findings)</h2><div class="section">
    ${findings.length === 0 ? "<p style='color:#10B981;font-size:14px;'>No compliance findings</p>" : findings.map(f => `<div class="finding finding-${f.severity}"><span class="severity sev-${f.severity}">${f.severity}</span> <span style="color:#94A3B8;font-size:12px;margin-left:8px;">${f.rule_id} · ${f.standard_id}</span><p style="font-size:13px;margin:8px 0 0 0;">${f.finding}</p></div>`).join("")}
  </div>
  ${entitySignals.length > 0 ? `<h2>Recent Signals (${entitySignals.length})</h2><div class="section">${entitySignals.map(s => `<div class="signal"><strong style="font-size:14px;">${s.title}</strong><div style="color:#94A3B8;font-size:12px;margin-top:4px;">${s.source} · ${s.severity}</div><p style="font-size:13px;margin:8px 0 0 0;">${s.description}</p></div>`).join("")}</div>` : ""}
  <div class="footer">Generated by EAMS · ${now}</div>
</div></body></html>`;
    } else if (template === "integration-spec") {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Integration Specification: ${entity.name}</title>
<style>
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 40px; line-height: 1.6; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { color: #F1F5F9; font-size: 24px; margin-bottom: 4px; }
  h2 { color: #0F7173; font-size: 18px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; margin-top: 32px; }
  .subtitle { color: #94A3B8; font-size: 14px; margin-bottom: 24px; }
  .section { background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-top: 16px; }
  .int-point { padding: 12px; border: 1px solid #334155; border-radius: 6px; margin-top: 8px; }
  .int-header { display: flex; justify-content: space-between; align-items: center; }
  .int-label { font-size: 13px; color: #94A3B8; }
  .int-value { font-size: 14px; font-family: 'JetBrains Mono', monospace; }
  .proto-badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; background: #0F7173/20; color: #0F7173; border: 1px solid #0F7173/40; }
  .crit-badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; margin-left: 6px; }
  .crit-sync { background: #EF4444/15; color: #EF4444; border: 1px solid #EF4444/30; }
  .crit-async { background: #3B82F6/15; color: #3B82F6; border: 1px solid #3B82F6/30; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #334155; color: #64748B; font-size: 12px; text-align: center; }
</style></head><body><div class="container">
  <h1>Integration Specification: ${entity.name}</h1>
  <div class="subtitle">${entity.domain} domain · ${entity.eams_id}</div>
  ${entity.description ? `<p style="color:#CBD5E1;font-size:14px;">${entity.description}</p>` : ""}
  <h2>Outbound Integration Points (${outbound.length})</h2><div class="section">
    ${outbound.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No outbound integrations</p>" : outbound.map(r => `<div class="int-point">
      <div class="int-header"><span class="int-value">${r.to_name}</span><span>${r.protocol ? `<span class="proto-badge">${r.protocol}</span>` : ""}<span class="crit-badge ${r.criticality?.includes("sync") ? "crit-sync" : "crit-async"}">${r.criticality || "informational"}</span></span></div>
      <div style="margin-top:6px;"><span class="int-label">Relationship:</span> <span style="font-size:13px;">${r.rel_type}</span></div>
      ${r.description ? `<div style="margin-top:4px;font-size:13px;color:#94A3B8;">${r.description}</div>` : ""}
      ${r.sla_dependency_ms ? `<div style="margin-top:4px;"><span class="int-label">SLA:</span> <span style="font-size:13px;">${r.sla_dependency_ms}ms</span></div>` : ""}
    </div>`).join("")}
  </div>
  <h2>Inbound Integration Points (${inbound.length})</h2><div class="section">
    ${inbound.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No inbound integrations</p>" : inbound.map(r => `<div class="int-point">
      <div class="int-header"><span class="int-value">${r.from_name}</span><span>${r.protocol ? `<span class="proto-badge">${r.protocol}</span>` : ""}<span class="crit-badge ${r.criticality?.includes("sync") ? "crit-sync" : "crit-async"}">${r.criticality || "informational"}</span></span></div>
      <div style="margin-top:6px;"><span class="int-label">Relationship:</span> <span style="font-size:13px;">${r.rel_type}</span></div>
      ${r.description ? `<div style="margin-top:4px;font-size:13px;color:#94A3B8;">${r.description}</div>` : ""}
    </div>`).join("")}
  </div>
  <h2>Dependencies</h2><div class="section">
    ${outbound.filter(r => r.criticality?.includes("critical")).length > 0 ? `<p style="font-size:14px;color:#EF4444;margin-bottom:8px;">Critical Dependencies (${outbound.filter(r => r.criticality?.includes("critical")).length})</p>` : ""}
    ${outbound.filter(r => r.criticality?.includes("critical")).map(r => `<div style="font-size:13px;padding:4px 0;border-bottom:1px solid #334155/50;">→ ${r.to_name} (${r.protocol || r.rel_type})</div>`).join("")}
    ${outbound.filter(r => !r.criticality?.includes("critical")).length > 0 ? `<p style="font-size:14px;color:#94A3B8;margin-top:12px;margin-bottom:8px;">Non-Critical Dependencies (${outbound.filter(r => !r.criticality?.includes("critical")).length})</p>` : ""}
    ${outbound.filter(r => !r.criticality?.includes("critical")).map(r => `<div style="font-size:13px;padding:4px 0;border-bottom:1px solid #334155/50;color:#94A3B8;">→ ${r.to_name} (${r.protocol || r.rel_type})</div>`).join("")}
    ${outbound.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No dependencies</p>" : ""}
  </div>
  <div class="footer">Generated by EAMS · ${now}</div>
</div></body></html>`;
    } else {
      return res.status(400).json({ error: "Invalid template. Use 'system-overview' or 'integration-spec'" });
    }

    return res.json({
      job_id: jobId,
      status: "completed",
      template,
      title: template === "system-overview" ? `System Overview: ${entity.name}` : `Integration Specification: ${entity.name}`,
      html,
    });
  });

  app.get("/api/artifacts/jobs/:job_id", (req, res) => {
    return res.json({
      job_id: req.params.job_id,
      status: "completed",
      message: "Artifact generation simulated",
    });
  });

  // ── Metamodel ──────────────────────────────────────────

  app.get("/api/metamodel", (_req, res) => {
    const metamodel = {
      nodes: [
        { kind: "goal", label: "Goal", description: "Strategic business objectives", color: "#2563EB" },
        { kind: "capability", label: "Capability", description: "Business capabilities that fulfill goals", color: "#6B4C9A" },
        { kind: "process", label: "Process", description: "Business processes that realize capabilities", color: "#0F7173" },
        { kind: "system", label: "System", description: "Software systems that automate processes", color: "#1B3A5C" },
        { kind: "container", label: "Container", description: "Deployable components within systems", color: "#0F7173" },
        { kind: "data_entity", label: "Data Entity", description: "Logical data objects managed by systems", color: "#7C5E3C" },
        { kind: "standard", label: "Standard", description: "Technology and compliance standards", color: "#6D28D9" },
        { kind: "decision", label: "Decision", description: "Architecture Decision Records", color: "#D97706" },
        { kind: "actor", label: "Actor", description: "People or external systems that interact", color: "#64748B" },
      ],
      edges: [
        { from: "goal", to: "capability", rel_type: "supported_by", label: "supported by" },
        { from: "capability", to: "process", rel_type: "realized_by", label: "realized by" },
        { from: "process", to: "system", rel_type: "automated_by", label: "automated by" },
        { from: "system", to: "container", rel_type: "container_of", label: "contains" },
        { from: "system", to: "data_entity", rel_type: "manages", label: "manages" },
        { from: "system", to: "system", rel_type: "uses", label: "uses" },
        { from: "container", to: "container", rel_type: "calls", label: "calls" },
        { from: "system", to: "standard", rel_type: "governed_by", label: "governed by" },
        { from: "decision", to: "system", rel_type: "applies_to", label: "applies to" },
        { from: "actor", to: "system", rel_type: "interacts_with", label: "interacts with" },
      ],
      counts: {} as Record<string, number>,
    };

    const allEntities = storage.getAllEntities();
    for (const e of allEntities) {
      metamodel.counts[e.kind] = (metamodel.counts[e.kind] || 0) + 1;
    }

    return res.json(metamodel);
  });

  // ── Scenario Analysis ─────────────────────────────────

  app.post("/api/scenarios/analyze", (req, res) => {
    const actions = req.body?.actions || [];
    const results: any[] = [];

    for (const action of actions) {
      if (action.type === "deprecate") {
        const entity = storage.getEntity(action.target_entity_id);
        const dependents = storage.getRelationships(action.target_entity_id, "inbound");
        const lineage = storage.getLineage(action.target_entity_id, "down");
        results.push({
          action,
          entity,
          direct_impact: dependents.length,
          total_impact: lineage.nodes.length,
          affected_entities: lineage.nodes.map((n: any) => ({ eams_id: n.eams_id, name: n.name, kind: n.kind })),
          affected_relationships: dependents,
          risk_level: dependents.length > 5 ? "high" : dependents.length > 2 ? "medium" : "low",
          warnings: [],
        });
      } else if (action.type === "remove") {
        const entity = storage.getEntity(action.target_entity_id);
        const allRels = storage.getRelationships(action.target_entity_id);
        const lineageDown = storage.getLineage(action.target_entity_id, "down");
        results.push({
          action,
          entity,
          direct_impact: allRels.length,
          total_impact: lineageDown.nodes.length,
          affected_entities: lineageDown.nodes.map((n: any) => ({ eams_id: n.eams_id, name: n.name, kind: n.kind })),
          affected_relationships: allRels,
          risk_level: allRels.length > 8 ? "critical" : allRels.length > 4 ? "high" : "medium",
          warnings: (entity as any)?.criticality === "tier-1" ? ["WARNING: Tier-1 critical system"] : [],
        });
      }
    }

    return res.json({ scenario_id: `scenario-${Date.now()}`, results });
  });

  // ── Health Dashboard ─────────────────────────────────

  app.get("/api/health", (_req, res) => {
    const allEntities = storage.getAllEntities();
    const allFindings = storage.getComplianceFindings();
    const allSignals = storage.getSignals();

    const domains = storage.getDomains();
    const domainHealth = domains.map(domain => {
      const domainEntities = allEntities.filter(e => e.domain === domain);
      const domainFindings = allFindings.filter(f => domainEntities.some(e => e.eams_id === f.entity_id));
      const domainSignals = allSignals.filter(s => {
        const affected = JSON.parse(s.affected_entities || "[]");
        return affected.some((id: string) => domainEntities.some(e => e.eams_id === id));
      });

      const totalEntities = domainEntities.length;
      const complianceScore = totalEntities > 0 ? Math.max(0, 100 - (domainFindings.length * 15)) : 100;
      const signalScore = Math.max(0, 100 - (domainSignals.filter(s => s.severity === "critical").length * 30) - (domainSignals.filter(s => s.severity === "high").length * 15) - (domainSignals.filter(s => s.severity === "medium").length * 5));
      const lifecycleScore = (() => {
        const deprecated = domainEntities.filter(e => e.status === "deprecated" || (e as any).lifecycle === "end-of-life").length;
        return totalEntities > 0 ? Math.round(((totalEntities - deprecated) / totalEntities) * 100) : 100;
      })();
      const reviewScore = (() => {
        const overdue = domainEntities.filter(e => {
          if (!(e as any).metadata_review_due) return false;
          return new Date((e as any).metadata_review_due) < new Date();
        }).length;
        return totalEntities > 0 ? Math.round(((totalEntities - overdue) / totalEntities) * 100) : 100;
      })();

      const overall = Math.round((complianceScore + signalScore + lifecycleScore + reviewScore) / 4);

      return {
        domain,
        entity_count: totalEntities,
        overall_score: overall,
        compliance_score: complianceScore,
        signal_score: signalScore,
        lifecycle_score: lifecycleScore,
        review_score: reviewScore,
        findings_count: domainFindings.length,
        active_signals: domainSignals.length,
        critical_signals: domainSignals.filter(s => s.severity === "critical").length,
        deprecated_count: domainEntities.filter(e => e.status === "deprecated").length,
      };
    });

    const kinds = [...new Set(allEntities.map(e => e.kind))];
    const kindHealth = kinds.map(kind => {
      const kindEntities = allEntities.filter(e => e.kind === kind);
      return {
        kind,
        total: kindEntities.length,
        active: kindEntities.filter(e => e.status === "active").length,
        deprecated: kindEntities.filter(e => e.status === "deprecated").length,
        proposed: kindEntities.filter(e => e.status === "proposed").length,
      };
    });

    const overallScore = domainHealth.length > 0 ? Math.round(domainHealth.reduce((sum, d) => sum + d.overall_score, 0) / domainHealth.length) : 100;

    return res.json({
      overall_score: overallScore,
      domains: domainHealth,
      kinds: kindHealth,
      total_entities: allEntities.length,
      total_findings: allFindings.length,
      total_signals: allSignals.length,
    });
  });

  return httpServer;
}
