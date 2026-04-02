/**
 * Client-side implementations for POST endpoints in static deployment.
 * When deployed to Netlify (static JSON), these replace server-side POST handlers.
 */

import { apiRequest } from "./queryClient";

// Detect static mode: if we get a 404 on a POST, we're in static mode
let _staticMode: boolean | null = null;

async function isStaticMode(): Promise<boolean> {
  if (_staticMode !== null) return _staticMode;
  try {
    const res = await fetch("/api/health.json", { method: "HEAD" });
    _staticMode = res.ok;
  } catch {
    _staticMode = false;
  }
  return _staticMode;
}

/** Generate artifact HTML client-side using entity data already available */
export function generateArtifactHTML(
  entity: any,
  relationships: any[],
  findings: any[],
  signals: any[],
  template: string
): { job_id: string; status: string; template: string; title: string; html: string } {
  const jobId = `job-${Date.now()}`;
  const now = new Date().toISOString();

  const outbound = relationships.filter((r: any) => r.from_entity_id === entity.eams_id);
  const inbound = relationships.filter((r: any) => r.to_entity_id === entity.eams_id);

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
  .rel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .rel-table th { text-align: left; color: #94A3B8; padding: 6px 8px; border-bottom: 1px solid #334155; font-weight: 500; }
  .rel-table td { padding: 6px 8px; border-bottom: 1px solid #334155/50; }
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
  </div>
  <h2>Technology Stack</h2><div class="section">
    ${entity.technology_primary ? `<div class="row"><span class="label">Primary</span><span class="value">${entity.technology_primary}</span></div>` : ""}
    ${entity.technology_language ? `<div class="row"><span class="label">Language</span><span class="value">${entity.technology_language}</span></div>` : ""}
    ${entity.technology_framework ? `<div class="row"><span class="label">Framework</span><span class="value">${entity.technology_framework}</span></div>` : ""}
    ${entity.technology_runtime ? `<div class="row"><span class="label">Runtime</span><span class="value">${entity.technology_runtime}</span></div>` : ""}
    ${entity.technology_hosting ? `<div class="row"><span class="label">Hosting</span><span class="value">${entity.technology_hosting}</span></div>` : ""}
  </div>
  <h2>Related Entities (${relationships.length})</h2><div class="section">
    ${relationships.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No relationships</p>" : `<table class="rel-table"><thead><tr><th>Direction</th><th>Type</th><th>Entity</th><th>Protocol</th></tr></thead><tbody>
    ${outbound.map((r: any) => `<tr><td style="color:#0F7173;">outbound</td><td>${r.rel_type}</td><td>${r.to_entity_name || r.to_entity_id}</td><td style="color:#94A3B8;">${r.protocol || "—"}</td></tr>`).join("")}
    ${inbound.map((r: any) => `<tr><td style="color:#94A3B8;">inbound</td><td>${r.rel_type}</td><td>${r.from_entity_name || r.from_entity_id}</td><td style="color:#94A3B8;">${r.protocol || "—"}</td></tr>`).join("")}
    </tbody></table>`}
  </div>
  <h2>Compliance Status (${findings.length} findings)</h2><div class="section">
    ${findings.length === 0 ? "<p style='color:#10B981;font-size:14px;'>No compliance findings</p>" : findings.map((f: any) => `<div style="padding:12px;border:1px solid #334155;border-radius:6px;margin-top:8px;"><span style="font-size:11px;font-weight:600;">${f.severity}</span> <span style="color:#94A3B8;font-size:12px;margin-left:8px;">${f.rule_id} · ${f.standard_id}</span><p style="font-size:13px;margin:8px 0 0 0;">${f.finding}</p></div>`).join("")}
  </div>
  ${signals.length > 0 ? `<h2>Recent Signals (${signals.length})</h2><div class="section">${signals.map((s: any) => `<div style="padding:10px;border:1px solid #334155;border-radius:6px;margin-top:8px;"><strong style="font-size:14px;">${s.title}</strong><div style="color:#94A3B8;font-size:12px;margin-top:4px;">${s.source} · ${s.severity}</div><p style="font-size:13px;margin:8px 0 0 0;">${s.description}</p></div>`).join("")}</div>` : ""}
  <div class="footer">Generated by EAMS · ${now}</div>
</div></body></html>`;
  } else {
    // integration-spec
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Integration Specification: ${entity.name}</title>
<style>
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 40px; line-height: 1.6; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { color: #F1F5F9; font-size: 24px; margin-bottom: 4px; }
  h2 { color: #0F7173; font-size: 18px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; margin-top: 32px; }
  .subtitle { color: #94A3B8; font-size: 14px; margin-bottom: 24px; }
  .section { background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-top: 16px; }
  .int-point { padding: 12px; border: 1px solid #334155; border-radius: 6px; margin-top: 8px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #334155; color: #64748B; font-size: 12px; text-align: center; }
</style></head><body><div class="container">
  <h1>Integration Specification: ${entity.name}</h1>
  <div class="subtitle">${entity.domain} domain · ${entity.eams_id}</div>
  ${entity.description ? `<p style="color:#CBD5E1;font-size:14px;">${entity.description}</p>` : ""}
  <h2>Outbound Integration Points (${outbound.length})</h2><div class="section">
    ${outbound.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No outbound integrations</p>" : outbound.map((r: any) => `<div class="int-point"><strong>${r.to_entity_name || r.to_entity_id}</strong><div style="margin-top:6px;color:#94A3B8;font-size:13px;">${r.rel_type} · ${r.protocol || "N/A"} · ${r.criticality || "informational"}</div>${r.description ? `<div style="margin-top:4px;font-size:13px;color:#94A3B8;">${r.description}</div>` : ""}</div>`).join("")}
  </div>
  <h2>Inbound Integration Points (${inbound.length})</h2><div class="section">
    ${inbound.length === 0 ? "<p style='color:#94A3B8;font-size:14px;'>No inbound integrations</p>" : inbound.map((r: any) => `<div class="int-point"><strong>${r.from_entity_name || r.from_entity_id}</strong><div style="margin-top:6px;color:#94A3B8;font-size:13px;">${r.rel_type} · ${r.protocol || "N/A"} · ${r.criticality || "informational"}</div>${r.description ? `<div style="margin-top:4px;font-size:13px;color:#94A3B8;">${r.description}</div>` : ""}</div>`).join("")}
  </div>
  <div class="footer">Generated by EAMS · ${now}</div>
</div></body></html>`;
  }

  return {
    job_id: jobId,
    status: "completed",
    template,
    title: template === "system-overview" ? `System Overview: ${entity.name}` : `Integration Specification: ${entity.name}`,
    html,
  };
}

/** Client-side scenario analysis using pre-fetched relationship/lineage data */
export async function analyzeScenarioStatic(
  actions: { type: string; target_entity_id: string }[]
): Promise<{ scenario_id: string; results: any[] }> {
  const results: any[] = [];

  for (const action of actions) {
    // Fetch entity data, relationships, and lineage
    var entity: any = null;
    var rels: any[] = [];
    var lineageNodes: any[] = [];

    try {
      const entityRes = await apiRequest("GET", `/api/entities/${action.target_entity_id}`);
      if (entityRes.ok) entity = await entityRes.json();
    } catch {}

    try {
      const relsRes = await apiRequest("GET", `/api/entities/${action.target_entity_id}/relationships`);
      if (relsRes.ok) rels = await relsRes.json();
    } catch {}

    try {
      const lineageRes = await apiRequest("GET", `/api/graph/lineage/${action.target_entity_id}?direction=down`);
      if (lineageRes.ok) {
        const lineageData = await lineageRes.json();
        lineageNodes = lineageData.nodes || [];
      }
    } catch {}

    const inbound = rels.filter((r: any) => r.to_entity_id === action.target_entity_id);
    const riskLevel = action.type === "remove"
      ? (rels.length > 8 ? "critical" : rels.length > 4 ? "high" : "medium")
      : (inbound.length > 5 ? "high" : inbound.length > 2 ? "medium" : "low");

    results.push({
      action,
      entity,
      direct_impact: inbound.length,
      total_impact: lineageNodes.length,
      affected_entities: lineageNodes.map((n: any) => ({ eams_id: n.eams_id, name: n.name, kind: n.kind })),
      affected_relationships: action.type === "remove" ? rels : inbound,
      risk_level: riskLevel,
      warnings: entity?.criticality === "tier-1" ? ["WARNING: Tier-1 critical system"] : [],
    });
  }

  return { scenario_id: `scenario-${Date.now()}`, results };
}

/** Client-side mock compile */
export function mockCompile(): any {
  const compileId = `compile-${Date.now()}`;
  return {
    compile_id: compileId,
    branch: "main",
    git_sha: Math.random().toString(36).substring(2, 14),
    trigger: "manual",
    outcome: "partial_success",
    entities_total: 52,
    entities_passed: 50,
    entities_blocked: 2,
    diff_added: 0,
    diff_modified: 0,
    diff_removed: 0,
    errors: "[]",
    compliance_findings: JSON.stringify({ violations: 2, warnings: 3, advisories: 1 }),
    blocked_entities: JSON.stringify(["system.legacy-claims-api", "container.legacy-soap-adapter"]),
    stage_timings: JSON.stringify({
      parse: 95, validate: 245, normalize: 72, resolve: 183,
      compile: 412, compliance: 134, diff: 67, publish: 38,
    }),
    started_at: new Date().toISOString(),
    completed_at: new Date(Date.now() + 2000).toISOString(),
  };
}

/** Client-side mock DSL validate */
export function mockDslValidate(content: string, filePath: string): any {
  const lines = content.split("\n").length;
  return {
    valid: true,
    file: filePath,
    entities_found: Math.min(lines, 3),
    relationships_found: Math.min(lines - 3, 2),
    warnings: [],
  };
}

/** Client-side mock advisory acknowledge */
export function mockAdvisoryAcknowledge(advisoryId: string, disposition: string, note: string): any {
  return {
    advisory_id: advisoryId,
    status: "acknowledged",
    acknowledged_at: new Date().toISOString(),
    acknowledged_disposition: disposition,
    acknowledged_note: note,
    acknowledged_by: "architect@company.com",
  };
}
