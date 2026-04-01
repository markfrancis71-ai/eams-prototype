# EAMS Prototype — Build Specification

## Overview
Build a working demo of the Enterprise Architecture Management System (EAMS). This is a local-running prototype using the webapp template (Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM + SQLite).

## Architecture Decisions for Prototype
- **SQLite** replaces OpenSearch + DynamoDB (single DB for entities, relationships, compile records, viewpoints, advisory outputs)
- **Mock Ardoq layer** — local JSON-based store simulating Ardoq read/write
- **File-based DSL** — YAML files in a `dsl/` directory within the project (no Git integration, but file-based authoring)
- **In-process compiler** — Node.js implementation of the 8-stage pipeline running server-side
- **D3.js diagrams** rendered client-side from canonical render graph JSON
- **LLM Advisory** — stub/mock returning realistic structured responses (no actual LLM calls)

## Data Model (shared/schema.ts)

### Core Tables

**entities** — All architecture entities (systems, containers, capabilities, processes, etc.)
- id: integer, primary key, auto-increment
- eams_id: text, unique, not null (e.g., "system.claims-processing")
- kind: text, not null (system, container, component, capability, process, data_entity, data_product, actor, goal, decision, standard, infrastructure)
- name: text, not null
- domain: text, not null
- status: text, not null, default "active" (active, proposed, deprecated, retired)
- description: text
- ownership_architect: text
- ownership_business_owner: text
- criticality: text (tier-1, tier-2, tier-3)
- lifecycle: text (production, development, planned, retired)
- tpm_id: text
- technology_primary: text
- technology_language: text
- technology_framework: text
- technology_runtime: text
- technology_hosting: text
- container_type: text (api, ui, worker, database, cache, queue, stream, batch, gateway, sidecar, library)
- parent_system_id: text (eams_id of parent system for containers)
- nfr_availability: text
- nfr_throughput: text
- nfr_latency: text
- nfr_data_classification: text (public, internal, confidential, pii, phi, pci)
- nfr_encryption: text
- nfr_retention: text
- tags: text (JSON array as string)
- metadata_created: text
- metadata_last_reviewed: text
- metadata_review_due: text
- compliance_status: text (compliant, warning, violation, unchecked)
- git_sha: text
- compiled_at: text
- branch: text, default "main"
- content_hash: text
- raw_yaml: text (the original DSL YAML content)

**relationships** — All relationships between entities
- id: integer, primary key, auto-increment
- eams_rel_id: text, unique, not null
- rel_type: text, not null (uses, consumes, publishes_to, subscribes_to, stores_in, reads_from, deployed_on, supported_by, realized_by, invokes, governed_by, constrains, produces, contracts_with, container_of)
- from_entity_id: text, not null (eams_id)
- to_entity_id: text, not null (eams_id)
- criticality: text (synchronous-critical, async, non-critical, informational)
- protocol: text
- sla_dependency_ms: integer
- description: text
- branch: text, default "main"

**compile_records** — Compile pipeline audit trail
- id: integer, primary key, auto-increment
- compile_id: text, unique, not null
- branch: text, not null
- git_sha: text
- trigger: text (manual, cli, auto)
- outcome: text (success, partial_success, failed)
- entities_total: integer
- entities_passed: integer
- entities_blocked: integer
- diff_added: integer
- diff_modified: integer
- diff_removed: integer
- errors: text (JSON)
- compliance_findings: text (JSON)
- blocked_entities: text (JSON)
- stage_timings: text (JSON)
- started_at: text
- completed_at: text

**viewpoint_definitions** — Viewpoint specs
- id: integer, primary key, auto-increment
- viewpoint_id: text, unique, not null
- name: text, not null
- description: text
- scope_strategy: text (parameter-seed, domain-query, entity-query)
- stakeholders: text (JSON array)
- parameters: text (JSON)
- scope_config: text (JSON)
- include_rules: text (JSON)
- filters: text (JSON)
- styling: text (JSON)
- layout: text (JSON)
- output_config: text (JSON)
- version: text

**advisory_outputs** — LLM advisory results
- id: integer, primary key, auto-increment
- advisory_id: text, unique, not null
- output_type: text (compliance_assessment, risk_identification, design_alternatives, impact_analysis, explanation, standards_guidance)
- scope_entity_id: text
- scope_mode: text (entity, domain, standard)
- branch: text, default "main"
- status: text (pending, completed, acknowledged)
- disposition: text (accepted, accepted_with_modifications, rejected, noted)
- disposition_note: text
- model_tier: text
- content: text (JSON — the full advisory output)
- data_gaps: text (JSON)
- generated_at: text
- acknowledged_at: text
- acknowledged_by: text

**branches** — Branch registry
- id: integer, primary key, auto-increment
- branch_name: text, unique, not null
- intent: text (project, proposal, experiment, migration)
- description: text
- review_status: text (draft, in-review, approved, merged)
- author: text
- base_branch: text, default "main"
- created_at: text

**compliance_findings** — Per-entity compliance findings
- id: integer, primary key, auto-increment
- entity_id: text, not null (eams_id)
- standard_id: text, not null
- rule_id: text
- severity: text (violation, warning, advisory)
- finding: text
- deterministic: integer (boolean — 1 for compiler, 0 for LLM)
- compile_id: text
- branch: text, default "main"

**signals** — Operational signals
- id: integer, primary key, auto-increment
- signal_id: text, unique
- signal_type: text (incident, performance, lifecycle, compliance, feedback)
- source: text
- source_id: text
- title: text
- description: text
- affected_entities: text (JSON array of eams_ids)
- severity: text (low, medium, high, critical)
- timestamp: text

## API Endpoints to Implement (server/routes.ts)

### Entity Endpoints
- GET /api/entities/:eams_id — Single entity by qualified ID
- GET /api/entities/lookup — Fast lookup by tpm_id, name, or ardoq_id
- GET /api/entities/:eams_id/relationships — All relationships for entity
- GET /api/entities/:eams_id/context-bundle — Rich context bundle
- GET /api/domains/:domain/entities — All entities in a domain

### Graph Traversal
- GET /api/graph/traverse — Subgraph from starting entity
- GET /api/graph/lineage/:eams_id — Full traceability lineage

### Viewpoints
- GET /api/viewpoints — List all viewpoint definitions
- GET /api/viewpoints/:viewpoint_id/resolve — Resolve viewpoint to render graph

### Search
- GET /api/search — Full-text search across entities

### Branch & Diff
- GET /api/branches — List all branches
- GET /api/diff/:branch — Structured diff for branch

### Compile
- POST /api/compile — Trigger a compile run
- GET /api/compile/status — Current compile status
- GET /api/compile/records — Compile history

### Advisory
- POST /api/advisory/request — Request advisory output
- GET /api/advisory/:advisory_id — Get advisory output
- POST /api/advisory/:advisory_id/acknowledge — Acknowledge output
- GET /api/advisory — List advisory outputs

### DSL Management
- GET /api/dsl/files — List DSL files
- GET /api/dsl/files/:path — Read a DSL file
- PUT /api/dsl/files/:path — Write/update a DSL file
- POST /api/dsl/validate — Validate a DSL file

### Artifact Generation
- POST /api/artifacts/generate — Generate artifact (HTML report, diagram bundle)
- GET /api/artifacts/jobs/:job_id — Poll job status

## Sample Seed Data

Seed the Claims domain from the specification examples:
- 3 systems: Claims Processing, Claims Portal, Claims Data Platform
- ~18 containers under Claims Processing (Adjudication API, Rules Engine, Claims Database, Event Router, etc.)
- Capabilities: Claim Adjudication, First Notice of Loss, Claim Settlement, etc.
- Processes: FNOL Process, Adjudication Process
- Data entities and products
- Goals and decisions (ADRs)
- Relationships between all entities
- Standards and compliance findings
- Also seed Policy and Billing domains with lighter coverage (2-3 systems each)

## Viewpoints to Pre-seed
- viewpoint.c4-context — C4 System Context
- viewpoint.c4-container — C4 Container View
- viewpoint.capability-map — Capability Heat Map
- viewpoint.blast-radius — Blast Radius
- viewpoint.domain-interactions — Domain Interaction Map
- viewpoint.integration-surface — System Integration Surface
- viewpoint.tier1-dependency — Tier-1 Dependency Graph
