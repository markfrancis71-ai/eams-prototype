import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Entities ──────────────────────────────────────────────
export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eams_id: text("eams_id").notNull().unique(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  status: text("status").notNull().default("active"),
  description: text("description"),
  ownership_architect: text("ownership_architect"),
  ownership_business_owner: text("ownership_business_owner"),
  criticality: text("criticality"),
  lifecycle: text("lifecycle"),
  tpm_id: text("tpm_id"),
  technology_primary: text("technology_primary"),
  technology_language: text("technology_language"),
  technology_framework: text("technology_framework"),
  technology_runtime: text("technology_runtime"),
  technology_hosting: text("technology_hosting"),
  container_type: text("container_type"),
  parent_system_id: text("parent_system_id"),
  nfr_availability: text("nfr_availability"),
  nfr_throughput: text("nfr_throughput"),
  nfr_latency: text("nfr_latency"),
  nfr_data_classification: text("nfr_data_classification"),
  nfr_encryption: text("nfr_encryption"),
  nfr_retention: text("nfr_retention"),
  tags: text("tags"),
  metadata_created: text("metadata_created"),
  metadata_last_reviewed: text("metadata_last_reviewed"),
  metadata_review_due: text("metadata_review_due"),
  compliance_status: text("compliance_status"),
  git_sha: text("git_sha"),
  compiled_at: text("compiled_at"),
  branch: text("branch").default("main"),
  content_hash: text("content_hash"),
  raw_yaml: text("raw_yaml"),
});

export const insertEntitySchema = createInsertSchema(entities).omit({ id: true });
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entities.$inferSelect;

// ── Relationships ─────────────────────────────────────────
export const relationships = sqliteTable("relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eams_rel_id: text("eams_rel_id").notNull().unique(),
  rel_type: text("rel_type").notNull(),
  from_entity_id: text("from_entity_id").notNull(),
  to_entity_id: text("to_entity_id").notNull(),
  criticality: text("criticality"),
  protocol: text("protocol"),
  sla_dependency_ms: integer("sla_dependency_ms"),
  description: text("description"),
  branch: text("branch").default("main"),
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({ id: true });
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;

// ── Compile Records ───────────────────────────────────────
export const compile_records = sqliteTable("compile_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  compile_id: text("compile_id").notNull().unique(),
  branch: text("branch").notNull(),
  git_sha: text("git_sha"),
  trigger: text("trigger"),
  outcome: text("outcome"),
  entities_total: integer("entities_total"),
  entities_passed: integer("entities_passed"),
  entities_blocked: integer("entities_blocked"),
  diff_added: integer("diff_added"),
  diff_modified: integer("diff_modified"),
  diff_removed: integer("diff_removed"),
  errors: text("errors"),
  compliance_findings: text("compliance_findings"),
  blocked_entities: text("blocked_entities"),
  stage_timings: text("stage_timings"),
  started_at: text("started_at"),
  completed_at: text("completed_at"),
});

export const insertCompileRecordSchema = createInsertSchema(compile_records).omit({ id: true });
export type InsertCompileRecord = z.infer<typeof insertCompileRecordSchema>;
export type CompileRecord = typeof compile_records.$inferSelect;

// ── Viewpoint Definitions ─────────────────────────────────
export const viewpoint_definitions = sqliteTable("viewpoint_definitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  viewpoint_id: text("viewpoint_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  scope_strategy: text("scope_strategy"),
  stakeholders: text("stakeholders"),
  parameters: text("parameters"),
  scope_config: text("scope_config"),
  include_rules: text("include_rules"),
  filters: text("filters"),
  styling: text("styling"),
  layout: text("layout"),
  output_config: text("output_config"),
  version: text("version"),
});

export const insertViewpointSchema = createInsertSchema(viewpoint_definitions).omit({ id: true });
export type InsertViewpoint = z.infer<typeof insertViewpointSchema>;
export type ViewpointDefinition = typeof viewpoint_definitions.$inferSelect;

// ── Advisory Outputs ──────────────────────────────────────
export const advisory_outputs = sqliteTable("advisory_outputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  advisory_id: text("advisory_id").notNull().unique(),
  output_type: text("output_type"),
  scope_entity_id: text("scope_entity_id"),
  scope_mode: text("scope_mode"),
  branch: text("branch").default("main"),
  status: text("status"),
  disposition: text("disposition"),
  disposition_note: text("disposition_note"),
  model_tier: text("model_tier"),
  content: text("content"),
  data_gaps: text("data_gaps"),
  generated_at: text("generated_at"),
  acknowledged_at: text("acknowledged_at"),
  acknowledged_by: text("acknowledged_by"),
});

export const insertAdvisorySchema = createInsertSchema(advisory_outputs).omit({ id: true });
export type InsertAdvisory = z.infer<typeof insertAdvisorySchema>;
export type AdvisoryOutput = typeof advisory_outputs.$inferSelect;

// ── Branches ──────────────────────────────────────────────
export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branch_name: text("branch_name").notNull().unique(),
  intent: text("intent"),
  description: text("description"),
  review_status: text("review_status"),
  author: text("author"),
  base_branch: text("base_branch").default("main"),
  created_at: text("created_at"),
});

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// ── Compliance Findings ───────────────────────────────────
export const compliance_findings = sqliteTable("compliance_findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entity_id: text("entity_id").notNull(),
  standard_id: text("standard_id").notNull(),
  rule_id: text("rule_id"),
  severity: text("severity"),
  finding: text("finding"),
  deterministic: integer("deterministic"),
  compile_id: text("compile_id"),
  branch: text("branch").default("main"),
});

export const insertComplianceFindingSchema = createInsertSchema(compliance_findings).omit({ id: true });
export type InsertComplianceFinding = z.infer<typeof insertComplianceFindingSchema>;
export type ComplianceFinding = typeof compliance_findings.$inferSelect;

// ── Signals ───────────────────────────────────────────────
export const signals = sqliteTable("signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  signal_id: text("signal_id").unique(),
  signal_type: text("signal_type"),
  source: text("source"),
  source_id: text("source_id"),
  title: text("title"),
  description: text("description"),
  affected_entities: text("affected_entities"),
  severity: text("severity"),
  timestamp: text("timestamp"),
});

export const insertSignalSchema = createInsertSchema(signals).omit({ id: true });
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;
