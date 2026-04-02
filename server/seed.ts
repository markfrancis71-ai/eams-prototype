import { storage } from "./storage";

export function seedDatabase() {
  // Check if already seeded
  const existing = storage.getAllEntities();
  if (existing.length > 0) return;

  // ══════════════════════════════════════════════════════════
  //  CLAIMS DOMAIN (rich)
  // ══════════════════════════════════════════════════════════

  // Systems
  storage.createEntity({
    eams_id: "system.claims-processing", kind: "system", name: "Claims Processing System",
    domain: "claims", status: "active", description: "Core claims processing system handling end-to-end claim lifecycle from FNOL through settlement. Processes approximately 45,000 claims per month across all lines of business.",
    ownership_architect: "Sarah Chen", ownership_business_owner: "Mike Rodriguez",
    criticality: "tier-1", lifecycle: "production", tpm_id: "TPM-CL-001",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17", technology_framework: "Spring Boot 3.2",
    technology_runtime: "JVM 17", technology_hosting: "AWS ECS Fargate",
    nfr_availability: "99.95%", nfr_throughput: "500 claims/min", nfr_latency: "p99 < 200ms",
    nfr_data_classification: "pii", nfr_encryption: "AES-256 at rest, TLS 1.3 in transit",
    nfr_retention: "7 years", tags: JSON.stringify(["core", "claims", "tier-1"]),
    metadata_created: "2023-01-15", metadata_last_reviewed: "2025-11-01", metadata_review_due: "2026-05-01",
    compliance_status: "warning", branch: "main", content_hash: "abc123",
  });

  storage.createEntity({
    eams_id: "system.claims-portal", kind: "system", name: "Claims Portal",
    domain: "claims", status: "active", description: "Customer and adjuster-facing web portal for claims submission, tracking, and management. Supports both desktop and mobile access.",
    ownership_architect: "Sarah Chen", ownership_business_owner: "Lisa Park",
    criticality: "tier-1", lifecycle: "production", tpm_id: "TPM-CL-002",
    technology_primary: "React/Node.js", technology_language: "TypeScript", technology_framework: "Next.js 14",
    technology_runtime: "Node.js 20", technology_hosting: "AWS CloudFront + ECS",
    nfr_availability: "99.9%", nfr_throughput: "10,000 concurrent users", nfr_latency: "p99 < 500ms",
    nfr_data_classification: "pii", compliance_status: "compliant",
    tags: JSON.stringify(["portal", "claims", "customer-facing"]),
    metadata_created: "2023-06-01", metadata_last_reviewed: "2025-12-01", branch: "main", content_hash: "def456",
  });

  storage.createEntity({
    eams_id: "system.claims-data-platform", kind: "system", name: "Claims Data Platform",
    domain: "claims", status: "active", description: "Analytics and reporting platform for claims data, providing real-time dashboards and batch reporting capabilities.",
    ownership_architect: "David Kim", ownership_business_owner: "Mike Rodriguez",
    criticality: "tier-2", lifecycle: "production", tpm_id: "TPM-CL-003",
    technology_primary: "Snowflake/dbt", technology_language: "SQL/Python",
    technology_hosting: "AWS + Snowflake",
    nfr_data_classification: "confidential", compliance_status: "compliant",
    tags: JSON.stringify(["data", "analytics", "claims"]),
    metadata_created: "2024-01-10", branch: "main", content_hash: "ghi789",
  });

  storage.createEntity({
    eams_id: "system.legacy-claims-api", kind: "system", name: "Legacy Claims API",
    domain: "claims", status: "deprecated", description: "Legacy SOAP-based claims API. Scheduled for decommission by Q3 2026. Still serves 15% of integration traffic from partner systems.",
    ownership_architect: "Sarah Chen", criticality: "tier-2", lifecycle: "retired",
    technology_primary: "Java EE", technology_language: "Java 8", technology_framework: "JAX-WS",
    technology_runtime: "JBoss EAP", technology_hosting: "On-premises DC2",
    compliance_status: "violation",
    tags: JSON.stringify(["legacy", "deprecated", "soap"]),
    metadata_created: "2015-03-01", metadata_review_due: "2026-03-01", branch: "main", content_hash: "jkl012",
  });

  // Containers under Claims Processing System
  storage.createEntity({
    eams_id: "container.adjudication-api", kind: "container", name: "Adjudication API",
    domain: "claims", status: "active", description: "REST API service handling claim adjudication decisions. Orchestrates rules engine evaluation, fraud checks, and settlement calculations.",
    parent_system_id: "system.claims-processing", container_type: "api",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17", technology_framework: "Spring Boot 3.2",
    technology_runtime: "JVM 17", technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1", lifecycle: "production",
    nfr_availability: "99.95%", nfr_latency: "p99 < 150ms", nfr_throughput: "200 req/s",
    nfr_data_classification: "pii", compliance_status: "compliant",
    tags: JSON.stringify(["api", "adjudication", "core"]),
    metadata_created: "2023-02-01", branch: "main", content_hash: "cnt001",
  });

  storage.createEntity({
    eams_id: "container.rules-engine", kind: "container", name: "Rules Engine",
    domain: "claims", status: "active", description: "Business rules engine for claims adjudication. Contains 2,400+ rules across auto, property, and liability lines.",
    parent_system_id: "system.claims-processing", container_type: "worker",
    technology_primary: "Drools", technology_language: "Java 17", technology_framework: "Drools 8.x",
    criticality: "tier-1", lifecycle: "production",
    nfr_latency: "p99 < 50ms per rule set evaluation",
    compliance_status: "compliant",
    tags: JSON.stringify(["rules", "drools", "adjudication"]),
    metadata_created: "2023-02-15", branch: "main", content_hash: "cnt002",
  });

  storage.createEntity({
    eams_id: "container.claims-database", kind: "container", name: "Claims Database",
    domain: "claims", status: "active", description: "Primary claims data store. Aurora PostgreSQL with read replicas for reporting queries.",
    parent_system_id: "system.claims-processing", container_type: "database",
    technology_primary: "Aurora PostgreSQL", technology_language: "SQL",
    technology_hosting: "AWS RDS",
    criticality: "tier-1", lifecycle: "production",
    nfr_availability: "99.99%", nfr_data_classification: "pii",
    nfr_encryption: "AES-256 at rest", nfr_retention: "7 years",
    compliance_status: "compliant",
    tags: JSON.stringify(["database", "postgresql", "claims"]),
    metadata_created: "2023-01-20", branch: "main", content_hash: "cnt003",
  });

  storage.createEntity({
    eams_id: "container.event-router", kind: "container", name: "Event Router",
    domain: "claims", status: "active", description: "Kafka-based event routing for claims domain events. Handles FNOL, status change, payment, and notification events.",
    parent_system_id: "system.claims-processing", container_type: "stream",
    technology_primary: "Apache Kafka", technology_framework: "Kafka Streams",
    technology_hosting: "AWS MSK",
    criticality: "tier-1", lifecycle: "production",
    nfr_throughput: "50,000 events/min", nfr_availability: "99.99%",
    compliance_status: "compliant",
    tags: JSON.stringify(["kafka", "events", "streaming"]),
    metadata_created: "2023-03-01", branch: "main", content_hash: "cnt004",
  });

  storage.createEntity({
    eams_id: "container.claims-notification-service", kind: "container", name: "Claims Notification Service",
    domain: "claims", status: "active", description: "Handles email, SMS, and push notifications for claims status updates, document requests, and settlement communications.",
    parent_system_id: "system.claims-processing", container_type: "worker",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS Lambda",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["notifications", "email", "sms"]),
    metadata_created: "2023-04-01", branch: "main", content_hash: "cnt005",
  });

  storage.createEntity({
    eams_id: "container.claims-reporting-service", kind: "container", name: "Claims Reporting Service",
    domain: "claims", status: "active", description: "Generates operational and regulatory reports. Includes daily loss runs, monthly reserve reports, and ad-hoc analytics.",
    parent_system_id: "system.claims-processing", container_type: "batch",
    technology_primary: "Python", technology_language: "Python 3.11", technology_framework: "Pandas/dbt",
    technology_hosting: "AWS Batch",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["reporting", "batch", "analytics"]),
    metadata_created: "2023-05-01", branch: "main", content_hash: "cnt006",
  });

  storage.createEntity({
    eams_id: "container.document-storage-service", kind: "container", name: "Document Storage Service",
    domain: "claims", status: "active", description: "Manages claim-related documents including photos, PDFs, police reports, and medical records. Integrates with OCR for auto-extraction.",
    parent_system_id: "system.claims-processing", container_type: "api",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS S3 + Lambda",
    criticality: "tier-2", lifecycle: "production",
    nfr_data_classification: "phi",
    compliance_status: "warning",
    tags: JSON.stringify(["documents", "storage", "ocr"]),
    metadata_created: "2023-04-15", branch: "main", content_hash: "cnt007",
  });

  // Containers under Claims Portal
  storage.createEntity({
    eams_id: "container.claims-web-ui", kind: "container", name: "Claims Web UI",
    domain: "claims", status: "active", description: "React-based single-page application for claims management. Supports both customer self-service and adjuster workflows.",
    parent_system_id: "system.claims-portal", container_type: "ui",
    technology_primary: "React", technology_language: "TypeScript", technology_framework: "Next.js 14",
    technology_runtime: "Browser", technology_hosting: "AWS CloudFront",
    criticality: "tier-1", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["ui", "react", "web"]),
    metadata_created: "2023-06-15", branch: "main", content_hash: "cnt008",
  });

  storage.createEntity({
    eams_id: "container.claims-mobile-bff", kind: "container", name: "Claims Mobile BFF",
    domain: "claims", status: "active", description: "Backend-for-Frontend service optimized for mobile clients. Aggregates data from multiple backend services.",
    parent_system_id: "system.claims-portal", container_type: "api",
    technology_primary: "Node.js", technology_language: "TypeScript", technology_framework: "Express",
    technology_runtime: "Node.js 20", technology_hosting: "AWS ECS Fargate",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["bff", "mobile", "api"]),
    metadata_created: "2023-07-01", branch: "main", content_hash: "cnt009",
  });

  // Capabilities
  storage.createEntity({
    eams_id: "capability.claim-adjudication", kind: "capability", name: "Claim Adjudication",
    domain: "claims", status: "active", description: "The ability to evaluate a claim against policy terms, coverage rules, and fraud indicators to produce an adjudication decision.",
    criticality: "tier-1", tags: JSON.stringify(["core-capability"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "cap001",
  });

  storage.createEntity({
    eams_id: "capability.fnol", kind: "capability", name: "First Notice of Loss",
    domain: "claims", status: "active", description: "The ability to receive and register initial loss notifications across all channels (web, mobile, phone, email).",
    criticality: "tier-1", tags: JSON.stringify(["core-capability"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "cap002",
  });

  storage.createEntity({
    eams_id: "capability.claim-settlement", kind: "capability", name: "Claim Settlement",
    domain: "claims", status: "active", description: "The ability to calculate, authorize, and execute claim payments including partial payments, reserves, and recoveries.",
    criticality: "tier-1", tags: JSON.stringify(["core-capability"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "cap003",
  });

  storage.createEntity({
    eams_id: "capability.subrogation", kind: "capability", name: "Subrogation",
    domain: "claims", status: "active", description: "The ability to identify, pursue, and recover subrogation claims from third parties.",
    criticality: "tier-2", tags: JSON.stringify(["capability"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "cap004",
  });

  storage.createEntity({
    eams_id: "capability.fraud-detection", kind: "capability", name: "Fraud Detection",
    domain: "claims", status: "active", description: "The ability to detect, flag, and investigate potentially fraudulent claims using rules-based and ML-based indicators.",
    criticality: "tier-1", tags: JSON.stringify(["capability", "ml"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "cap005",
  });

  // Processes
  storage.createEntity({
    eams_id: "process.fnol-process", kind: "process", name: "FNOL Process",
    domain: "claims", status: "active", description: "End-to-end First Notice of Loss process from initial notification through claim creation and assignment.",
    tags: JSON.stringify(["process", "fnol"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "proc001",
  });

  storage.createEntity({
    eams_id: "process.adjudication-process", kind: "process", name: "Adjudication Process",
    domain: "claims", status: "active", description: "Claim evaluation process including coverage verification, damage assessment, liability determination, and settlement calculation.",
    tags: JSON.stringify(["process", "adjudication"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "proc002",
  });

  storage.createEntity({
    eams_id: "process.settlement-process", kind: "process", name: "Settlement Process",
    domain: "claims", status: "active", description: "Payment authorization and execution process for approved claims including partial payments, supplements, and final settlements.",
    tags: JSON.stringify(["process", "settlement"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "proc003",
  });

  // Additional Processes (BPMN-style)
  storage.createEntity({
    eams_id: "process.subrogation-recovery", kind: "process", name: "Subrogation Recovery Process",
    domain: "claims", status: "active",
    description: "End-to-end subrogation workflow: identify recovery opportunity → send demand letter → negotiate with third-party insurer → collect payment → close recovery. Average cycle time: 45 days. Recovery rate: 62% of identified opportunities.",
    ownership_architect: "Sarah Chen", ownership_business_owner: "David Park",
    criticality: "tier-2", lifecycle: "production",
    tags: JSON.stringify(["process", "subrogation", "recovery", "bpmn"]),
    metadata_created: "2023-06-01", metadata_last_reviewed: "2025-09-15", metadata_review_due: "2026-03-15",
    branch: "main", content_hash: "proc004",
  });

  storage.createEntity({
    eams_id: "process.fraud-investigation", kind: "process", name: "Fraud Investigation Process",
    domain: "claims", status: "active",
    description: "SIU investigation workflow triggered by fraud scoring above threshold (>0.7). Steps: case assignment → evidence collection → interview scheduling → determination → referral/closure. SLA: initial review within 48 hours, determination within 30 days.",
    ownership_architect: "Sarah Chen", ownership_business_owner: "Lisa Torres",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "fraud", "siu", "investigation", "bpmn"]),
    metadata_created: "2023-03-01", metadata_last_reviewed: "2025-11-01", metadata_review_due: "2026-05-01",
    branch: "main", content_hash: "proc005",
  });

  storage.createEntity({
    eams_id: "process.cat-claims", kind: "process", name: "Catastrophe Claims Process",
    domain: "claims", status: "active",
    description: "Specialized high-volume claims process activated during declared catastrophe events (hurricanes, hail, wildfire). Includes: CAT declaration trigger → surge staffing → field adjuster deployment → expedited FNOL intake → batch adjudication → accelerated settlement. Handles 10x normal volume with modified SLAs.",
    ownership_architect: "Sarah Chen", ownership_business_owner: "Mike Rodriguez",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "catastrophe", "cat", "surge", "bpmn"]),
    metadata_created: "2023-01-15", metadata_last_reviewed: "2025-08-01", metadata_review_due: "2026-02-01",
    branch: "main", content_hash: "proc006",
  });

  // Additional Capability
  storage.createEntity({
    eams_id: "capability.catastrophe-management", kind: "capability", name: "Catastrophe Management",
    domain: "claims", status: "active",
    description: "The ability to declare catastrophe events, activate surge protocols, deploy field resources, and manage high-volume claims processing with modified SLAs and approval authorities.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "cat"]),
    metadata_created: "2023-01-15", branch: "main", content_hash: "cap006",
  });

  // Data Entities
  storage.createEntity({
    eams_id: "data.claim-record", kind: "data_entity", name: "Claim Record",
    domain: "claims", status: "active", description: "Master claim record containing claim metadata, status, amounts, parties, and lifecycle events.",
    nfr_data_classification: "pii", nfr_retention: "7 years",
    tags: JSON.stringify(["data", "pii"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "dat001",
  });

  storage.createEntity({
    eams_id: "data.claimant", kind: "data_entity", name: "Claimant",
    domain: "claims", status: "active", description: "Person or entity making the claim. Includes contact information, identification, and claim history.",
    nfr_data_classification: "pii",
    tags: JSON.stringify(["data", "pii", "person"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "dat002",
  });

  storage.createEntity({
    eams_id: "data.policy-reference", kind: "data_entity", name: "Policy Reference",
    domain: "claims", status: "active", description: "Reference to the insurance policy associated with a claim. Includes coverage terms, limits, and deductibles.",
    nfr_data_classification: "confidential",
    tags: JSON.stringify(["data", "policy"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "dat003",
  });

  storage.createEntity({
    eams_id: "data.adjudication-decision", kind: "data_entity", name: "Adjudication Decision",
    domain: "claims", status: "active", description: "Record of the adjudication decision including coverage determination, payment amount, and rationale.",
    nfr_data_classification: "confidential",
    tags: JSON.stringify(["data", "decision"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "dat004",
  });

  // Goals
  storage.createEntity({
    eams_id: "goal.reduce-claims-cycle", kind: "goal", name: "Reduce Claims Cycle Time",
    domain: "claims", status: "active", description: "Reduce average claims cycle time from 14 days to 7 days by Q4 2026 through automation and process optimization.",
    tags: JSON.stringify(["goal", "performance"]),
    metadata_created: "2025-01-01", branch: "main", content_hash: "goal001",
  });

  storage.createEntity({
    eams_id: "goal.improve-adjudication-accuracy", kind: "goal", name: "Improve Adjudication Accuracy",
    domain: "claims", status: "active", description: "Improve automated adjudication accuracy from 82% to 95% by enhancing rules engine and incorporating ML models.",
    tags: JSON.stringify(["goal", "accuracy", "ml"]),
    metadata_created: "2025-01-01", branch: "main", content_hash: "goal002",
  });

  // Decisions
  storage.createEntity({
    eams_id: "decision.adr-0042", kind: "decision", name: "ADR-0042: Real-time Adjudication",
    domain: "claims", status: "active", description: "Decision to implement real-time adjudication for auto claims under $5,000 using a dedicated fast-path rules engine, bypassing the batch queue.",
    tags: JSON.stringify(["adr", "architecture-decision"]),
    metadata_created: "2025-06-15", branch: "main", content_hash: "dec001",
  });

  storage.createEntity({
    eams_id: "decision.adr-0043", kind: "decision", name: "ADR-0043: Event-driven Claims",
    domain: "claims", status: "active", description: "Decision to migrate claims processing from request-response to event-driven architecture using Kafka for improved decoupling and scalability.",
    tags: JSON.stringify(["adr", "architecture-decision", "events"]),
    metadata_created: "2025-07-01", branch: "main", content_hash: "dec002",
  });

  // Standards
  storage.createEntity({
    eams_id: "standard.rest-api-first", kind: "standard", name: "REST API First",
    domain: "claims", status: "active", description: "All new services must expose REST APIs following the enterprise API design guidelines. SOAP interfaces are prohibited for new development.",
    tags: JSON.stringify(["standard", "api"]),
    metadata_created: "2024-01-01", branch: "main", content_hash: "std001",
  });

  storage.createEntity({
    eams_id: "standard.pii-data-handling", kind: "standard", name: "PII Data Handling Standard",
    domain: "claims", status: "active", description: "Requirements for handling personally identifiable information including encryption, access controls, audit logging, and retention policies.",
    tags: JSON.stringify(["standard", "pii", "security"]),
    metadata_created: "2024-01-01", branch: "main", content_hash: "std002",
  });

  storage.createEntity({
    eams_id: "standard.aws-deployment", kind: "standard", name: "AWS Deployment Standard",
    domain: "claims", status: "active", description: "All new workloads must be deployed to AWS using approved patterns: ECS Fargate for services, Lambda for event handlers, RDS/Aurora for databases.",
    tags: JSON.stringify(["standard", "aws", "deployment"]),
    metadata_created: "2024-03-01", branch: "main", content_hash: "std003",
  });

  // Actor
  storage.createEntity({
    eams_id: "actor.claims-adjuster", kind: "actor", name: "Claims Adjuster",
    domain: "claims", status: "active", description: "Insurance professional responsible for evaluating and processing claims.",
    tags: JSON.stringify(["actor", "user"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "act001",
  });

  storage.createEntity({
    eams_id: "actor.policyholder", kind: "actor", name: "Policyholder",
    domain: "claims", status: "active", description: "Customer who holds an insurance policy and may file claims.",
    tags: JSON.stringify(["actor", "customer"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "act002",
  });

  // ══════════════════════════════════════════════════════════
  //  POLICY DOMAIN (moderate)
  // ══════════════════════════════════════════════════════════

  storage.createEntity({
    eams_id: "system.policy-admin", kind: "system", name: "Policy Admin System",
    domain: "policy", status: "active", description: "Core policy administration system managing policy lifecycle from quoting through renewal. Handles all lines of business.",
    ownership_architect: "James Wilson", ownership_business_owner: "Amanda Foster",
    criticality: "tier-1", lifecycle: "production", tpm_id: "TPM-PL-001",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17",
    technology_hosting: "AWS ECS Fargate",
    nfr_availability: "99.95%", nfr_data_classification: "pii",
    compliance_status: "compliant",
    tags: JSON.stringify(["core", "policy"]),
    metadata_created: "2022-06-01", branch: "main", content_hash: "pol001",
  });

  storage.createEntity({
    eams_id: "system.policy-rating-engine", kind: "system", name: "Policy Rating Engine",
    domain: "policy", status: "active", description: "Calculates premiums based on risk factors, coverage selections, and actuarial tables. Supports real-time and batch rating.",
    ownership_architect: "James Wilson", criticality: "tier-1", lifecycle: "production",
    technology_primary: "Go", technology_language: "Go 1.21",
    technology_hosting: "AWS ECS Fargate",
    nfr_latency: "p99 < 100ms", compliance_status: "compliant",
    tags: JSON.stringify(["rating", "policy"]),
    metadata_created: "2023-03-01", branch: "main", content_hash: "pol002",
  });

  storage.createEntity({
    eams_id: "system.policy-document-gen", kind: "system", name: "Policy Document Generator",
    domain: "policy", status: "active", description: "Generates policy documents, endorsements, declarations pages, and certificates of insurance.",
    criticality: "tier-2", lifecycle: "production",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS Lambda",
    compliance_status: "compliant",
    tags: JSON.stringify(["documents", "policy"]),
    metadata_created: "2023-09-01", branch: "main", content_hash: "pol003",
  });

  // Policy containers
  storage.createEntity({
    eams_id: "container.policy-api", kind: "container", name: "Policy API",
    domain: "policy", status: "active", description: "REST API for policy CRUD operations, endorsements, and renewals.",
    parent_system_id: "system.policy-admin", container_type: "api",
    technology_primary: "Java/Spring Boot", criticality: "tier-1",
    compliance_status: "compliant",
    metadata_created: "2022-07-01", branch: "main", content_hash: "pcnt001",
  });

  storage.createEntity({
    eams_id: "container.policy-database", kind: "container", name: "Policy Database",
    domain: "policy", status: "active", description: "Primary policy data store with full history and audit trail.",
    parent_system_id: "system.policy-admin", container_type: "database",
    technology_primary: "Aurora PostgreSQL", criticality: "tier-1",
    nfr_data_classification: "pii",
    compliance_status: "compliant",
    metadata_created: "2022-06-15", branch: "main", content_hash: "pcnt002",
  });

  storage.createEntity({
    eams_id: "container.policy-event-bus", kind: "container", name: "Policy Event Bus",
    domain: "policy", status: "active", description: "Kafka-based event bus for policy domain events (issued, renewed, cancelled, endorsed).",
    parent_system_id: "system.policy-admin", container_type: "stream",
    technology_primary: "Apache Kafka",
    compliance_status: "compliant",
    metadata_created: "2023-01-01", branch: "main", content_hash: "pcnt003",
  });

  storage.createEntity({
    eams_id: "container.rating-api", kind: "container", name: "Rating API",
    domain: "policy", status: "active", description: "High-performance rating calculation API.",
    parent_system_id: "system.policy-rating-engine", container_type: "api",
    technology_primary: "Go", criticality: "tier-1",
    compliance_status: "compliant",
    metadata_created: "2023-03-15", branch: "main", content_hash: "pcnt004",
  });

  storage.createEntity({
    eams_id: "container.rating-tables", kind: "container", name: "Rating Tables Store",
    domain: "policy", status: "active", description: "Redis-cached actuarial rating tables and factors.",
    parent_system_id: "system.policy-rating-engine", container_type: "cache",
    technology_primary: "Redis",
    compliance_status: "compliant",
    metadata_created: "2023-03-15", branch: "main", content_hash: "pcnt005",
  });

  // Policy capabilities
  storage.createEntity({
    eams_id: "capability.policy-issuance", kind: "capability", name: "Policy Issuance",
    domain: "policy", status: "active", description: "The ability to issue new insurance policies across all lines of business.",
    criticality: "tier-1", metadata_created: "2022-01-01", branch: "main", content_hash: "pcap001",
  });

  storage.createEntity({
    eams_id: "capability.premium-calculation", kind: "capability", name: "Premium Calculation",
    domain: "policy", status: "active", description: "The ability to calculate premiums based on risk factors and coverage selections.",
    criticality: "tier-1", metadata_created: "2022-01-01", branch: "main", content_hash: "pcap002",
  });

  storage.createEntity({
    eams_id: "capability.policy-renewal", kind: "capability", name: "Policy Renewal",
    domain: "policy", status: "active", description: "The ability to process policy renewals including re-rating and document generation.",
    criticality: "tier-2", metadata_created: "2022-01-01", branch: "main", content_hash: "pcap003",
  });

  // Policy domain expansion — New containers
  storage.createEntity({
    eams_id: "container.policy-rating-api", kind: "container", name: "Policy Rating API",
    domain: "policy", status: "active", description: "REST API for real-time policy rating calculations. Handles quote rating, renewal re-rating, and endorsement re-rating across all lines of business.",
    parent_system_id: "system.policy-rating-engine", container_type: "api",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17", technology_framework: "Spring Boot 3.2",
    technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1", lifecycle: "production",
    nfr_latency: "p99 < 80ms", nfr_throughput: "1,000 req/s",
    compliance_status: "warning",
    tags: JSON.stringify(["api", "rating", "policy"]),
    metadata_created: "2023-04-01", branch: "main", content_hash: "pcnt006",
  });

  storage.createEntity({
    eams_id: "container.policy-rules-engine", kind: "container", name: "Policy Rules Engine",
    domain: "policy", status: "active", description: "Business rules engine for underwriting decisions. Evaluates risk acceptability, coverage eligibility, and pricing exceptions using Drools-based rule sets.",
    parent_system_id: "system.policy-admin", container_type: "worker",
    technology_primary: "Drools", technology_language: "Java 17", technology_framework: "Drools 8.x",
    technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1", lifecycle: "production",
    nfr_latency: "p99 < 60ms per rule set evaluation",
    compliance_status: "compliant",
    tags: JSON.stringify(["rules", "drools", "underwriting"]),
    metadata_created: "2023-05-01", branch: "main", content_hash: "pcnt007",
  });

  storage.createEntity({
    eams_id: "container.policy-document-store", kind: "container", name: "Policy Document Store",
    domain: "policy", status: "active", description: "Document storage for policy PDFs, endorsements, and declarations pages. S3-backed with metadata indexing and versioning.",
    parent_system_id: "system.policy-document-gen", container_type: "storage",
    technology_primary: "AWS S3", technology_language: "TypeScript",
    technology_hosting: "AWS S3 + Lambda",
    criticality: "tier-2", lifecycle: "production",
    nfr_data_classification: "pii",
    compliance_status: "compliant",
    tags: JSON.stringify(["storage", "documents", "s3"]),
    metadata_created: "2023-09-15", branch: "main", content_hash: "pcnt008",
  });

  storage.createEntity({
    eams_id: "container.policy-workflow-engine", kind: "container", name: "Policy Workflow Engine",
    domain: "policy", status: "active", description: "Orchestrates policy lifecycle workflows including new business, renewal, endorsement, and cancellation. Camunda BPM-based with custom task handlers.",
    parent_system_id: "system.policy-admin", container_type: "worker",
    technology_primary: "Camunda BPM", technology_language: "Java 17",
    technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1", lifecycle: "production",
    nfr_availability: "99.9%",
    compliance_status: "compliant",
    tags: JSON.stringify(["workflow", "bpm", "camunda"]),
    metadata_created: "2023-06-01", branch: "main", content_hash: "pcnt009",
  });

  storage.createEntity({
    eams_id: "container.policy-cache", kind: "container", name: "Policy Cache",
    domain: "policy", status: "active", description: "Redis cache layer for frequently accessed policy data, rate tables, and territory factors. Reduces database load by 70%.",
    parent_system_id: "system.policy-admin", container_type: "cache",
    technology_primary: "Redis", technology_hosting: "AWS ElastiCache",
    criticality: "tier-2", lifecycle: "production",
    nfr_latency: "p99 < 5ms",
    compliance_status: "compliant",
    tags: JSON.stringify(["cache", "redis", "performance"]),
    metadata_created: "2023-07-01", branch: "main", content_hash: "pcnt010",
  });

  // Policy domain expansion — New processes
  storage.createEntity({
    eams_id: "process.new-business-underwriting", kind: "process", name: "New Business Underwriting Process",
    domain: "policy", status: "active", description: "End-to-end new business workflow: application intake → risk assessment → underwriting decision → quote generation → binding → policy issuance. SLA: 48 hours for standard auto, 5 days for specialty.",
    ownership_architect: "James Wilson", ownership_business_owner: "Amanda Foster",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "underwriting", "new-business"]),
    metadata_created: "2022-06-01", metadata_last_reviewed: "2025-12-01", branch: "main", content_hash: "pproc001",
  });

  storage.createEntity({
    eams_id: "process.policy-renewal", kind: "process", name: "Policy Renewal Process",
    domain: "policy", status: "active", description: "Automated renewal process: renewal eligibility check → re-rating → renewal offer generation → member notification → acceptance/decline → policy reissue. 90-day advance processing window.",
    ownership_architect: "James Wilson", ownership_business_owner: "Amanda Foster",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "renewal", "automated"]),
    metadata_created: "2022-06-01", metadata_last_reviewed: "2025-11-01", branch: "main", content_hash: "pproc002",
  });

  storage.createEntity({
    eams_id: "process.endorsement-processing", kind: "process", name: "Endorsement Processing",
    domain: "policy", status: "active", description: "Mid-term policy change workflow: change request → impact assessment → re-rating → approval routing → endorsement issuance → billing adjustment.",
    ownership_architect: "James Wilson",
    criticality: "tier-2", lifecycle: "production",
    tags: JSON.stringify(["process", "endorsement", "mid-term-change"]),
    metadata_created: "2022-08-01", branch: "main", content_hash: "pproc003",
  });

  // Policy domain expansion — New capabilities
  storage.createEntity({
    eams_id: "capability.underwriting", kind: "capability", name: "Underwriting",
    domain: "policy", status: "active", description: "Ability to assess risk, determine insurability, and price policies based on risk factors, loss history, and underwriting guidelines.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "underwriting"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "pcap004",
  });

  storage.createEntity({
    eams_id: "capability.policy-lifecycle", kind: "capability", name: "Policy Lifecycle Management",
    domain: "policy", status: "active", description: "Ability to manage the full policy lifecycle from quote through renewal, including endorsements, cancellations, and reinstatements.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "lifecycle"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "pcap005",
  });

  // Policy domain expansion — New data entities
  storage.createEntity({
    eams_id: "data_entity.policy-record", kind: "data_entity", name: "Policy Record",
    domain: "policy", status: "active", description: "Core policy data object: policy number, effective dates, coverage limits, deductibles, premium, named insureds, covered vehicles/properties.",
    nfr_data_classification: "pii", nfr_retention: "10 years",
    tags: JSON.stringify(["data", "pii", "policy"]),
    metadata_created: "2022-06-01", branch: "main", content_hash: "pdat001",
  });

  storage.createEntity({
    eams_id: "data_entity.rate-table", kind: "data_entity", name: "Rate Table",
    domain: "policy", status: "active", description: "Rating factor tables: territory factors, vehicle symbols, driver classifications, multi-policy discounts, loyalty tiers. Updated quarterly by actuarial.",
    nfr_data_classification: "confidential",
    tags: JSON.stringify(["data", "actuarial", "rating"]),
    metadata_created: "2023-03-01", branch: "main", content_hash: "pdat002",
  });

  // ══════════════════════════════════════════════════════════
  //  BILLING DOMAIN (light)
  // ══════════════════════════════════════════════════════════

  storage.createEntity({
    eams_id: "system.billing", kind: "system", name: "Billing System",
    domain: "billing", status: "active", description: "Core billing system managing premium billing, payment processing, and accounts receivable for all lines of business.",
    ownership_architect: "Priya Patel", criticality: "tier-1", lifecycle: "production",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17",
    technology_hosting: "AWS ECS Fargate",
    nfr_availability: "99.95%", nfr_data_classification: "pci",
    compliance_status: "compliant",
    tags: JSON.stringify(["billing", "core"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bil001",
  });

  storage.createEntity({
    eams_id: "system.payment-gateway", kind: "system", name: "Payment Gateway",
    domain: "billing", status: "active", description: "Payment processing gateway supporting credit card, ACH, and wire transfers. PCI DSS Level 1 compliant.",
    criticality: "tier-1", lifecycle: "production",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS ECS Fargate",
    nfr_data_classification: "pci",
    compliance_status: "compliant",
    tags: JSON.stringify(["payments", "pci"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "bil002",
  });

  storage.createEntity({
    eams_id: "container.billing-api", kind: "container", name: "Billing API",
    domain: "billing", status: "active", description: "REST API for billing operations.",
    parent_system_id: "system.billing", container_type: "api",
    technology_primary: "Java/Spring Boot", criticality: "tier-1",
    compliance_status: "compliant",
    metadata_created: "2022-02-01", branch: "main", content_hash: "bcnt001",
  });

  storage.createEntity({
    eams_id: "container.billing-database", kind: "container", name: "Billing Database",
    domain: "billing", status: "active", description: "Billing data store with financial transaction history.",
    parent_system_id: "system.billing", container_type: "database",
    technology_primary: "Aurora PostgreSQL",
    nfr_data_classification: "pci",
    compliance_status: "compliant",
    metadata_created: "2022-01-15", branch: "main", content_hash: "bcnt002",
  });

  storage.createEntity({
    eams_id: "container.payment-processor", kind: "container", name: "Payment Processor",
    domain: "billing", status: "active", description: "Core payment processing service integrating with Stripe and bank APIs.",
    parent_system_id: "system.payment-gateway", container_type: "api",
    technology_primary: "Node.js",
    nfr_data_classification: "pci",
    compliance_status: "compliant",
    metadata_created: "2023-02-01", branch: "main", content_hash: "bcnt003",
  });

  // Billing domain expansion — New system
  storage.createEntity({
    eams_id: "system.payment-processor", kind: "system", name: "Payment Processor",
    domain: "billing", status: "active", description: "External payment processing integration hub. Handles credit card, ACH, and EFT transactions via Stripe and internal banking APIs.",
    ownership_architect: "Priya Patel", criticality: "tier-1", lifecycle: "production",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS ECS Fargate",
    nfr_availability: "99.99%", nfr_data_classification: "pci",
    nfr_encryption: "AES-256 at rest, TLS 1.3 in transit",
    compliance_status: "compliant",
    tags: JSON.stringify(["payments", "pci", "integration"]),
    metadata_created: "2023-06-01", branch: "main", content_hash: "bil003",
  });

  // Billing domain expansion — New containers
  storage.createEntity({
    eams_id: "container.payment-ledger", kind: "container", name: "Payment Ledger",
    domain: "billing", status: "active", description: "Double-entry accounting ledger for premium receivables, payments, refunds, and write-offs. PostgreSQL with strict ACID compliance.",
    parent_system_id: "system.billing", container_type: "database",
    technology_primary: "Aurora PostgreSQL", technology_language: "SQL",
    technology_hosting: "AWS RDS",
    criticality: "tier-1", lifecycle: "production",
    nfr_data_classification: "pci", nfr_availability: "99.99%",
    compliance_status: "compliant",
    tags: JSON.stringify(["database", "accounting", "ledger"]),
    metadata_created: "2022-02-15", branch: "main", content_hash: "bcnt004",
  });

  storage.createEntity({
    eams_id: "container.payment-processor-api", kind: "container", name: "Payment Processor API",
    domain: "billing", status: "active", description: "Payment gateway integration layer. Handles tokenization, authorization, capture, and refund workflows across Stripe and internal banking APIs.",
    parent_system_id: "system.payment-processor", container_type: "api",
    technology_primary: "Node.js", technology_language: "TypeScript", technology_framework: "Express",
    technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1", lifecycle: "production",
    nfr_latency: "p99 < 300ms", nfr_data_classification: "pci",
    compliance_status: "compliant",
    tags: JSON.stringify(["api", "payments", "integration"]),
    metadata_created: "2023-06-15", branch: "main", content_hash: "bcnt005",
  });

  storage.createEntity({
    eams_id: "container.billing-notification-service", kind: "container", name: "Billing Notification Service",
    domain: "billing", status: "active", description: "Sends billing reminders, payment confirmations, and past-due notices via email, SMS, and push notifications.",
    parent_system_id: "system.billing", container_type: "worker",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS Lambda",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["notifications", "billing", "email"]),
    metadata_created: "2022-05-01", branch: "main", content_hash: "bcnt006",
  });

  storage.createEntity({
    eams_id: "container.billing-scheduler", kind: "container", name: "Billing Scheduler",
    domain: "billing", status: "active", description: "Scheduled job runner for installment generation, auto-pay processing, and grace period enforcement. Runs nightly and on-demand.",
    parent_system_id: "system.billing", container_type: "batch",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17",
    technology_hosting: "AWS Batch",
    criticality: "tier-1", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["scheduler", "batch", "billing"]),
    metadata_created: "2022-04-01", branch: "main", content_hash: "bcnt007",
  });

  // Billing domain expansion — New processes
  storage.createEntity({
    eams_id: "process.premium-billing", kind: "process", name: "Premium Billing Process",
    domain: "billing", status: "active", description: "Monthly billing cycle: installment generation → payment collection → reconciliation → grace period management → cancellation for non-payment. Processes ~200K installments monthly.",
    ownership_architect: "Priya Patel",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "billing", "monthly-cycle"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bproc001",
  });

  storage.createEntity({
    eams_id: "process.payment-processing", kind: "process", name: "Payment Processing",
    domain: "billing", status: "active", description: "Real-time payment workflow: payment receipt → validation → authorization → capture → ledger posting → confirmation. Supports credit card, ACH, and EFT.",
    ownership_architect: "Priya Patel",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "payments", "real-time"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bproc002",
  });

  // Billing domain expansion — New capabilities
  storage.createEntity({
    eams_id: "capability.premium-collection", kind: "capability", name: "Premium Collection",
    domain: "billing", status: "active", description: "Ability to collect premiums through multiple payment methods, manage installment plans, and handle payment failures gracefully.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "billing"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bcap001",
  });

  storage.createEntity({
    eams_id: "capability.financial-reconciliation", kind: "capability", name: "Financial Reconciliation",
    domain: "billing", status: "active", description: "Ability to reconcile premium receivables with actual payments, identify discrepancies, and manage refunds/write-offs.",
    criticality: "tier-2",
    tags: JSON.stringify(["capability", "finance", "reconciliation"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bcap002",
  });

  // Billing domain expansion — New data entity
  storage.createEntity({
    eams_id: "data_entity.payment-transaction", kind: "data_entity", name: "Payment Transaction",
    domain: "billing", status: "active", description: "Payment record: transaction ID, amount, method, authorization code, status, timestamps, associated policy number.",
    nfr_data_classification: "pci", nfr_retention: "7 years",
    tags: JSON.stringify(["data", "pci", "financial"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "bdat001",
  });

  // ══════════════════════════════════════════════════════════
  //  OPERATIONS DOMAIN (light)
  // ══════════════════════════════════════════════════════════

  storage.createEntity({
    eams_id: "system.monitoring-platform", kind: "system", name: "Monitoring Platform",
    domain: "operations", status: "active", description: "Centralized monitoring and observability platform. Collects metrics, logs, and traces from all systems.",
    criticality: "tier-1", lifecycle: "production",
    technology_primary: "Datadog", technology_hosting: "SaaS",
    compliance_status: "compliant",
    tags: JSON.stringify(["monitoring", "observability"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ops001",
  });

  storage.createEntity({
    eams_id: "system.incident-management", kind: "system", name: "Incident Management System",
    domain: "operations", status: "active", description: "Incident detection, routing, and resolution management. Integrates with PagerDuty and Slack.",
    criticality: "tier-1", lifecycle: "production",
    technology_primary: "PagerDuty + ServiceNow", technology_hosting: "SaaS",
    compliance_status: "compliant",
    tags: JSON.stringify(["incidents", "operations"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ops002",
  });

  // Operations domain expansion — New systems
  storage.createEntity({
    eams_id: "system.log-analytics", kind: "system", name: "Log Analytics Platform",
    domain: "operations", status: "active", description: "Centralized log aggregation and analysis platform. ELK Stack (Elasticsearch, Logstash, Kibana) providing full-text search, log correlation, and anomaly detection across all systems.",
    ownership_architect: "Kevin Nguyen", criticality: "tier-2", lifecycle: "production",
    technology_primary: "ELK Stack", technology_language: "Java/Go",
    technology_hosting: "AWS OpenSearch Service",
    nfr_throughput: "500,000 log events/min", nfr_retention: "90 days hot, 1 year cold",
    compliance_status: "compliant",
    tags: JSON.stringify(["logging", "elk", "observability"]),
    metadata_created: "2022-03-01", branch: "main", content_hash: "ops003",
  });

  storage.createEntity({
    eams_id: "system.deployment-platform", kind: "system", name: "Deployment Platform",
    domain: "operations", status: "active", description: "CI/CD and container orchestration platform. Kubernetes (EKS) + Harness for automated deployments with blue-green and canary release strategies.",
    ownership_architect: "Kevin Nguyen", criticality: "tier-1", lifecycle: "production",
    technology_primary: "Kubernetes + Harness", technology_language: "Go/YAML",
    technology_hosting: "AWS EKS",
    nfr_availability: "99.95%",
    compliance_status: "compliant",
    tags: JSON.stringify(["cicd", "kubernetes", "deployment"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ops004",
  });

  // Operations domain expansion — New containers
  storage.createEntity({
    eams_id: "container.monitoring-dashboard", kind: "container", name: "Monitoring Dashboard",
    domain: "operations", status: "active", description: "Grafana dashboards for real-time system health, SLA tracking, and capacity metrics. 45+ dashboards covering all tier-1 and tier-2 systems.",
    parent_system_id: "system.monitoring-platform", container_type: "ui",
    technology_primary: "Grafana", technology_hosting: "AWS ECS Fargate",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["dashboard", "grafana", "monitoring"]),
    metadata_created: "2022-02-01", branch: "main", content_hash: "ocnt001",
  });

  storage.createEntity({
    eams_id: "container.alert-manager", kind: "container", name: "Alert Manager",
    domain: "operations", status: "active", description: "PagerDuty/OpsGenie integration for incident routing, escalation policies, and on-call scheduling. Routes alerts from Datadog to appropriate on-call teams.",
    parent_system_id: "system.monitoring-platform", container_type: "worker",
    technology_primary: "PagerDuty", technology_hosting: "SaaS",
    criticality: "tier-1", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["alerting", "pagerduty", "oncall"]),
    metadata_created: "2022-02-01", branch: "main", content_hash: "ocnt002",
  });

  storage.createEntity({
    eams_id: "container.log-collector", kind: "container", name: "Log Collector",
    domain: "operations", status: "active", description: "Filebeat/Fluentd log collection agents aggregating logs from all containers. Enriches logs with service metadata before forwarding to OpenSearch.",
    parent_system_id: "system.log-analytics", container_type: "agent",
    technology_primary: "Fluentd", technology_hosting: "AWS ECS (sidecar)",
    criticality: "tier-2", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["logging", "fluentd", "collection"]),
    metadata_created: "2022-03-15", branch: "main", content_hash: "ocnt003",
  });

  storage.createEntity({
    eams_id: "container.incident-tracker", kind: "container", name: "Incident Tracker",
    domain: "operations", status: "active", description: "ServiceNow integration for incident lifecycle management, RCA tracking, and SLA compliance reporting.",
    parent_system_id: "system.incident-management", container_type: "api",
    technology_primary: "ServiceNow", technology_hosting: "SaaS",
    criticality: "tier-1", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["incidents", "servicenow", "tracking"]),
    metadata_created: "2022-01-15", branch: "main", content_hash: "ocnt004",
  });

  storage.createEntity({
    eams_id: "container.deployment-pipeline", kind: "container", name: "Deployment Pipeline",
    domain: "operations", status: "active", description: "Harness deployment pipelines for blue-green and canary releases. Supports automated rollback on health check failure.",
    parent_system_id: "system.deployment-platform", container_type: "worker",
    technology_primary: "Harness", technology_hosting: "SaaS + AWS",
    criticality: "tier-1", lifecycle: "production",
    compliance_status: "compliant",
    tags: JSON.stringify(["cicd", "harness", "deployment"]),
    metadata_created: "2022-01-15", branch: "main", content_hash: "ocnt005",
  });

  storage.createEntity({
    eams_id: "container.k8s-cluster", kind: "container", name: "Kubernetes Cluster",
    domain: "operations", status: "active", description: "EKS Kubernetes cluster hosting containerized workloads. 12 node groups across 3 AZs with cluster autoscaler and Karpenter for node provisioning.",
    parent_system_id: "system.deployment-platform", container_type: "runtime",
    technology_primary: "AWS EKS", technology_language: "Go/YAML",
    technology_hosting: "AWS EKS",
    criticality: "tier-1", lifecycle: "production",
    nfr_availability: "99.95%",
    compliance_status: "compliant",
    tags: JSON.stringify(["kubernetes", "eks", "container-orchestration"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ocnt006",
  });

  // Operations domain expansion — New processes
  storage.createEntity({
    eams_id: "process.incident-management", kind: "process", name: "Incident Management Process",
    domain: "operations", status: "active", description: "Incident lifecycle: detection → triage → assignment → investigation → resolution → post-mortem → RCA documentation. SLA: P1 = 15 min response, 4 hour resolution.",
    ownership_architect: "Kevin Nguyen",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "incident", "sla"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "oproc001",
  });

  storage.createEntity({
    eams_id: "process.change-management", kind: "process", name: "Change Management Process",
    domain: "operations", status: "active", description: "Change request workflow: RFC submission → impact assessment → CAB review → approval → implementation → validation → closure. All production changes require CAB approval.",
    ownership_architect: "Kevin Nguyen",
    criticality: "tier-1", lifecycle: "production",
    tags: JSON.stringify(["process", "change-management", "cab"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "oproc002",
  });

  storage.createEntity({
    eams_id: "process.capacity-planning", kind: "process", name: "Capacity Planning Process",
    domain: "operations", status: "active", description: "Quarterly capacity review: utilization trend analysis → growth projection → infrastructure sizing → procurement request → provisioning. Covers compute, storage, and network.",
    ownership_architect: "Kevin Nguyen",
    criticality: "tier-2", lifecycle: "production",
    tags: JSON.stringify(["process", "capacity", "quarterly"]),
    metadata_created: "2022-06-01", branch: "main", content_hash: "oproc003",
  });

  // Operations domain expansion — New capabilities
  storage.createEntity({
    eams_id: "capability.observability", kind: "capability", name: "Observability",
    domain: "operations", status: "active", description: "Ability to monitor, trace, and debug distributed systems through metrics, logs, and traces with real-time alerting.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "observability"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ocap001",
  });

  storage.createEntity({
    eams_id: "capability.release-management", kind: "capability", name: "Release Management",
    domain: "operations", status: "active", description: "Ability to safely deploy software changes to production with automated testing, staged rollouts, and instant rollback.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "deployment"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ocap002",
  });

  storage.createEntity({
    eams_id: "capability.incident-response", kind: "capability", name: "Incident Response",
    domain: "operations", status: "active", description: "Ability to detect, respond to, and resolve production incidents within SLA targets with structured post-mortem processes.",
    criticality: "tier-1",
    tags: JSON.stringify(["core-capability", "incident-response"]),
    metadata_created: "2022-01-01", branch: "main", content_hash: "ocap003",
  });

  // ══════════════════════════════════════════════════════════
  //  CROSS-CUTTING ENTITIES
  // ══════════════════════════════════════════════════════════

  // New Goals
  storage.createEntity({
    eams_id: "goal.ensure-regulatory-compliance", kind: "goal", name: "Ensure Regulatory Compliance",
    domain: "policy", status: "active", description: "Ensure all P&C systems and processes comply with state insurance regulations, NAIC guidelines, and internal audit requirements. Zero critical audit findings target.",
    tags: JSON.stringify(["goal", "compliance", "regulatory"]),
    metadata_created: "2025-01-01", branch: "main", content_hash: "goal003",
  });

  storage.createEntity({
    eams_id: "goal.improve-member-experience", kind: "goal", name: "Improve Member Experience",
    domain: "operations", status: "active", description: "Deliver seamless digital experiences across quoting, servicing, and claims with <3 second page loads and >4.5 app store rating.",
    tags: JSON.stringify(["goal", "member-experience", "digital"]),
    metadata_created: "2025-01-01", branch: "main", content_hash: "goal004",
  });

  storage.createEntity({
    eams_id: "goal.operational-resilience", kind: "goal", name: "Operational Resilience",
    domain: "operations", status: "active", description: "Achieve 99.95% availability across all tier-1 systems with <15 minute incident detection and <4 hour resolution SLAs.",
    tags: JSON.stringify(["goal", "resilience", "availability"]),
    metadata_created: "2025-01-01", branch: "main", content_hash: "goal005",
  });

  // New Actors
  storage.createEntity({
    eams_id: "actor.member", kind: "actor", name: "Member",
    domain: "claims", status: "active", description: "USAA member (policyholder/claimant). Interacts with Claims Portal, Policy Admin, and Billing System via web and mobile applications.",
    tags: JSON.stringify(["actor", "customer", "member"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "act003",
  });

  storage.createEntity({
    eams_id: "actor.underwriter", kind: "actor", name: "Underwriter",
    domain: "policy", status: "active", description: "P&C underwriter. Uses Policy Admin System for risk assessment, exception handling, and manual review of complex applications.",
    tags: JSON.stringify(["actor", "underwriter", "policy"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "act004",
  });

  storage.createEntity({
    eams_id: "actor.external-vendor", kind: "actor", name: "External Vendor",
    domain: "claims", status: "active", description: "Third-party service providers: body shops, medical providers, contractors. Interact via Claims Portal API for assignment acceptance and status updates.",
    tags: JSON.stringify(["actor", "vendor", "external"]),
    metadata_created: "2023-01-01", branch: "main", content_hash: "act005",
  });

  // New Standards
  storage.createEntity({
    eams_id: "standard.api-design", kind: "standard", name: "API Design Standard",
    domain: "operations", status: "active", description: "RESTful API design standard: OpenAPI 3.0 spec required, semantic versioning, OAuth 2.0 auth, rate limiting, pagination. Applies to all API containers.",
    tags: JSON.stringify(["standard", "api", "openapi"]),
    metadata_created: "2024-01-01", branch: "main", content_hash: "std004",
  });

  storage.createEntity({
    eams_id: "standard.data-classification", kind: "standard", name: "Data Classification Standard",
    domain: "operations", status: "active", description: "Data classification standard: PII handling (encryption at rest AES-256, in transit TLS 1.3), retention policies, access controls per NIST 800-53.",
    tags: JSON.stringify(["standard", "data", "security", "nist"]),
    metadata_created: "2024-01-01", branch: "main", content_hash: "std005",
  });

  storage.createEntity({
    eams_id: "standard.cloud-native", kind: "standard", name: "Cloud-Native Architecture Standard",
    domain: "operations", status: "active", description: "Cloud-native architecture standard: 12-factor app principles, containerized deployment, horizontal scaling, health checks, graceful shutdown.",
    tags: JSON.stringify(["standard", "cloud-native", "12-factor"]),
    metadata_created: "2024-03-01", branch: "main", content_hash: "std006",
  });

  // New Decisions
  storage.createEntity({
    eams_id: "decision.event-driven-architecture", kind: "decision", name: "ADR: Event-Driven Architecture",
    domain: "operations", status: "active", description: "ADR: Adopt event-driven architecture using Apache Kafka for inter-system communication. Rationale: decoupling, scalability, audit trail. Status: accepted.",
    tags: JSON.stringify(["adr", "architecture-decision", "kafka"]),
    metadata_created: "2025-03-01", branch: "main", content_hash: "dec003",
  });

  storage.createEntity({
    eams_id: "decision.api-gateway-pattern", kind: "decision", name: "ADR: API Gateway Pattern",
    domain: "operations", status: "active", description: "ADR: Implement API gateway (Kong) for external-facing APIs. Rationale: centralized auth, rate limiting, observability. Status: accepted.",
    tags: JSON.stringify(["adr", "architecture-decision", "api-gateway"]),
    metadata_created: "2025-04-01", branch: "main", content_hash: "dec004",
  });

  storage.createEntity({
    eams_id: "decision.database-per-service", kind: "decision", name: "ADR: Database Per Service",
    domain: "operations", status: "active", description: "ADR: Each system owns its database. No shared databases. Rationale: loose coupling, independent deployability, technology flexibility. Status: accepted.",
    tags: JSON.stringify(["adr", "architecture-decision", "database"]),
    metadata_created: "2025-05-01", branch: "main", content_hash: "dec005",
  });

  // ══════════════════════════════════════════════════════════
  //  RELATIONSHIPS
  // ══════════════════════════════════════════════════════════

  const rels: Array<{id: string; type: string; from: string; to: string; crit?: string; proto?: string; desc?: string}> = [
    // Claims Processing System internals
    { id: "rel-001", type: "container_of", from: "system.claims-processing", to: "container.adjudication-api", desc: "Contains" },
    { id: "rel-002", type: "container_of", from: "system.claims-processing", to: "container.rules-engine", desc: "Contains" },
    { id: "rel-003", type: "container_of", from: "system.claims-processing", to: "container.claims-database", desc: "Contains" },
    { id: "rel-004", type: "container_of", from: "system.claims-processing", to: "container.event-router", desc: "Contains" },
    { id: "rel-005", type: "container_of", from: "system.claims-processing", to: "container.claims-notification-service", desc: "Contains" },
    { id: "rel-006", type: "container_of", from: "system.claims-processing", to: "container.claims-reporting-service", desc: "Contains" },
    { id: "rel-007", type: "container_of", from: "system.claims-processing", to: "container.document-storage-service", desc: "Contains" },

    // Claims Portal internals
    { id: "rel-008", type: "container_of", from: "system.claims-portal", to: "container.claims-web-ui", desc: "Contains" },
    { id: "rel-009", type: "container_of", from: "system.claims-portal", to: "container.claims-mobile-bff", desc: "Contains" },

    // Container-to-container dependencies
    { id: "rel-010", type: "uses", from: "container.adjudication-api", to: "container.rules-engine", crit: "synchronous-critical", proto: "gRPC", desc: "Evaluates claim rules" },
    { id: "rel-011", type: "stores_in", from: "container.adjudication-api", to: "container.claims-database", crit: "synchronous-critical", proto: "PostgreSQL", desc: "Reads/writes claim data" },
    { id: "rel-012", type: "publishes_to", from: "container.adjudication-api", to: "container.event-router", crit: "async", proto: "Kafka", desc: "Publishes adjudication events" },
    { id: "rel-013", type: "subscribes_to", from: "container.claims-notification-service", to: "container.event-router", crit: "async", proto: "Kafka", desc: "Subscribes to claim events" },
    { id: "rel-014", type: "reads_from", from: "container.claims-reporting-service", to: "container.claims-database", crit: "non-critical", proto: "PostgreSQL read replica", desc: "Reads claims data for reports" },
    { id: "rel-015", type: "stores_in", from: "container.document-storage-service", to: "container.claims-database", crit: "async", proto: "PostgreSQL", desc: "Stores document metadata" },

    // Portal to Processing
    { id: "rel-016", type: "uses", from: "container.claims-web-ui", to: "container.adjudication-api", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Submit and query claims" },
    { id: "rel-017", type: "uses", from: "container.claims-mobile-bff", to: "container.adjudication-api", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Mobile claims operations" },
    { id: "rel-018", type: "uses", from: "container.claims-web-ui", to: "container.document-storage-service", crit: "async", proto: "REST/HTTPS", desc: "Upload/download documents" },

    // Actor relationships
    { id: "rel-019", type: "uses", from: "actor.claims-adjuster", to: "system.claims-portal", crit: "synchronous-critical", desc: "Manages claims through portal" },
    { id: "rel-020", type: "uses", from: "actor.policyholder", to: "system.claims-portal", crit: "synchronous-critical", desc: "Files and tracks claims" },

    // Capability realizations
    { id: "rel-021", type: "realized_by", from: "capability.claim-adjudication", to: "system.claims-processing", desc: "Realized by claims processing system" },
    { id: "rel-022", type: "realized_by", from: "capability.fnol", to: "system.claims-processing", desc: "FNOL capability realized" },
    { id: "rel-023", type: "realized_by", from: "capability.fnol", to: "system.claims-portal", desc: "FNOL via portal" },
    { id: "rel-024", type: "realized_by", from: "capability.claim-settlement", to: "system.claims-processing", desc: "Settlement processing" },
    { id: "rel-025", type: "realized_by", from: "capability.fraud-detection", to: "container.rules-engine", desc: "Fraud rules in rules engine" },

    // Goal relationships
    { id: "rel-026", type: "supported_by", from: "goal.reduce-claims-cycle", to: "capability.claim-adjudication", desc: "Faster adjudication reduces cycle time" },
    { id: "rel-027", type: "supported_by", from: "goal.reduce-claims-cycle", to: "capability.fnol", desc: "Faster FNOL reduces cycle time" },
    { id: "rel-028", type: "supported_by", from: "goal.improve-adjudication-accuracy", to: "capability.fraud-detection", desc: "Better fraud detection improves accuracy" },

    // Decision relationships
    { id: "rel-029", type: "constrains", from: "decision.adr-0042", to: "container.adjudication-api", desc: "ADR-0042 constrains adjudication design" },
    { id: "rel-030", type: "constrains", from: "decision.adr-0043", to: "container.event-router", desc: "ADR-0043 requires event-driven architecture" },

    // Standard governance
    { id: "rel-031", type: "governed_by", from: "container.adjudication-api", to: "standard.rest-api-first", desc: "Must follow REST API standard" },
    { id: "rel-032", type: "governed_by", from: "container.claims-database", to: "standard.pii-data-handling", desc: "Must comply with PII handling" },
    { id: "rel-033", type: "governed_by", from: "system.claims-processing", to: "standard.aws-deployment", desc: "Must follow AWS deployment standard" },
    { id: "rel-034", type: "governed_by", from: "system.legacy-claims-api", to: "standard.rest-api-first", desc: "Violates REST-first standard" },

    // Data entity relationships
    { id: "rel-035", type: "produces", from: "container.adjudication-api", to: "data.adjudication-decision", desc: "Produces adjudication decisions" },
    { id: "rel-036", type: "stores_in", from: "data.claim-record", to: "container.claims-database", desc: "Stored in claims database" },
    { id: "rel-037", type: "uses", from: "container.adjudication-api", to: "data.claim-record", desc: "Uses claim records" },
    { id: "rel-038", type: "uses", from: "container.adjudication-api", to: "data.policy-reference", desc: "References policy data" },

    // Cross-domain: Claims → Policy
    { id: "rel-039", type: "uses", from: "system.claims-processing", to: "system.policy-admin", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Retrieves policy details for claim verification" },
    { id: "rel-040", type: "subscribes_to", from: "container.event-router", to: "container.policy-event-bus", crit: "async", proto: "Kafka", desc: "Subscribes to policy change events" },

    // Cross-domain: Claims → Billing
    { id: "rel-041", type: "uses", from: "system.claims-processing", to: "system.billing", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Triggers claim payments" },
    { id: "rel-042", type: "uses", from: "system.claims-processing", to: "system.payment-gateway", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Processes claim settlements" },

    // Cross-domain: Operations
    { id: "rel-043", type: "uses", from: "system.monitoring-platform", to: "system.claims-processing", crit: "non-critical", desc: "Monitors claims system health" },
    { id: "rel-044", type: "uses", from: "system.monitoring-platform", to: "system.policy-admin", crit: "non-critical", desc: "Monitors policy system health" },
    { id: "rel-045", type: "uses", from: "system.incident-management", to: "system.monitoring-platform", crit: "synchronous-critical", desc: "Receives alerts from monitoring" },

    // Policy domain internal
    { id: "rel-046", type: "container_of", from: "system.policy-admin", to: "container.policy-api", desc: "Contains" },
    { id: "rel-047", type: "container_of", from: "system.policy-admin", to: "container.policy-database", desc: "Contains" },
    { id: "rel-048", type: "container_of", from: "system.policy-admin", to: "container.policy-event-bus", desc: "Contains" },
    { id: "rel-049", type: "container_of", from: "system.policy-rating-engine", to: "container.rating-api", desc: "Contains" },
    { id: "rel-050", type: "container_of", from: "system.policy-rating-engine", to: "container.rating-tables", desc: "Contains" },
    { id: "rel-051", type: "uses", from: "container.policy-api", to: "container.rating-api", crit: "synchronous-critical", proto: "gRPC", desc: "Calculates premiums" },
    { id: "rel-052", type: "stores_in", from: "container.policy-api", to: "container.policy-database", crit: "synchronous-critical", proto: "PostgreSQL", desc: "Stores policy data" },
    { id: "rel-053", type: "reads_from", from: "container.rating-api", to: "container.rating-tables", crit: "synchronous-critical", proto: "Redis", desc: "Reads rating tables" },

    // Policy capability
    { id: "rel-054", type: "realized_by", from: "capability.policy-issuance", to: "system.policy-admin", desc: "Realized by policy admin" },
    { id: "rel-055", type: "realized_by", from: "capability.premium-calculation", to: "system.policy-rating-engine", desc: "Realized by rating engine" },
    { id: "rel-056", type: "realized_by", from: "capability.policy-renewal", to: "system.policy-admin", desc: "Realized by policy admin" },

    // Billing internal
    { id: "rel-057", type: "container_of", from: "system.billing", to: "container.billing-api", desc: "Contains" },
    { id: "rel-058", type: "container_of", from: "system.billing", to: "container.billing-database", desc: "Contains" },
    { id: "rel-059", type: "container_of", from: "system.payment-gateway", to: "container.payment-processor", desc: "Contains" },
    { id: "rel-060", type: "uses", from: "container.billing-api", to: "container.payment-processor", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Processes payments" },
    { id: "rel-061", type: "stores_in", from: "container.billing-api", to: "container.billing-database", crit: "synchronous-critical", proto: "PostgreSQL", desc: "Stores billing data" },

    // Legacy
    { id: "rel-062", type: "uses", from: "system.legacy-claims-api", to: "system.claims-processing", crit: "async", proto: "SOAP/XML", desc: "Legacy integration bridge" },

    // Process relationships
    { id: "rel-063", type: "realized_by", from: "process.fnol-process", to: "capability.fnol", desc: "FNOL process realizes FNOL capability" },
    { id: "rel-064", type: "realized_by", from: "process.adjudication-process", to: "capability.claim-adjudication", desc: "Adjudication process" },
    { id: "rel-065", type: "realized_by", from: "process.settlement-process", to: "capability.claim-settlement", desc: "Settlement process" },

    // Billing → Policy cross-domain
    { id: "rel-066", type: "uses", from: "system.billing", to: "system.policy-admin", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Retrieves policy billing schedules" },

    // Subrogation Recovery Process
    { id: "rel-080", type: "realized_by", from: "process.subrogation-recovery", to: "capability.subrogation", desc: "Subrogation process realizes subrogation capability" },
    { id: "rel-081", type: "automated_by", from: "process.subrogation-recovery", to: "system.claims-processing", desc: "Subrogation process automated by Claims Processing System" },

    // Fraud Investigation Process
    { id: "rel-082", type: "realized_by", from: "process.fraud-investigation", to: "capability.fraud-detection", desc: "Fraud investigation process realizes fraud detection capability" },
    { id: "rel-083", type: "automated_by", from: "process.fraud-investigation", to: "system.claims-processing", desc: "Fraud investigation automated by Claims Processing System" },
    { id: "rel-084", type: "uses", from: "process.fraud-investigation", to: "container.rules-engine", desc: "Fraud investigation uses Rules Engine for scoring" },

    // CAT Claims Process
    { id: "rel-085", type: "realized_by", from: "process.cat-claims", to: "capability.fnol", desc: "CAT claims process realizes FNOL capability at surge scale" },
    { id: "rel-086", type: "realized_by", from: "process.cat-claims", to: "capability.claim-adjudication", desc: "CAT claims includes batch adjudication" },
    { id: "rel-087", type: "automated_by", from: "process.cat-claims", to: "system.claims-processing", desc: "CAT process automated by Claims Processing System" },
    { id: "rel-088", type: "uses", from: "process.cat-claims", to: "container.event-router", desc: "CAT process uses Event Router for high-volume intake" },

    // Cross-process dependency
    { id: "rel-089", type: "triggers", from: "process.cat-claims", to: "process.fraud-investigation", desc: "CAT events trigger elevated fraud screening" },

    // Catastrophe Management capability links
    { id: "rel-090", type: "supported_by", from: "goal.reduce-claims-cycle", to: "capability.catastrophe-management", desc: "CAT management supports claims cycle reduction" },
    { id: "rel-091", type: "realized_by", from: "process.cat-claims", to: "capability.catastrophe-management", desc: "CAT claims process realizes CAT management capability" },

    // ── POLICY DOMAIN EXPANSION RELATIONSHIPS ──

    // New Policy containers → parent systems
    { id: "rel-100", type: "container_of", from: "system.policy-rating-engine", to: "container.policy-rating-api", desc: "Contains" },
    { id: "rel-101", type: "container_of", from: "system.policy-admin", to: "container.policy-rules-engine", desc: "Contains" },
    { id: "rel-102", type: "container_of", from: "system.policy-document-gen", to: "container.policy-document-store", desc: "Contains" },
    { id: "rel-103", type: "container_of", from: "system.policy-admin", to: "container.policy-workflow-engine", desc: "Contains" },
    { id: "rel-104", type: "container_of", from: "system.policy-admin", to: "container.policy-cache", desc: "Contains" },

    // Policy container-to-container dependencies
    { id: "rel-105", type: "uses", from: "container.policy-api", to: "container.policy-rules-engine", crit: "synchronous-critical", proto: "gRPC", desc: "Evaluates underwriting rules" },
    { id: "rel-106", type: "uses", from: "container.policy-api", to: "container.policy-cache", crit: "synchronous-critical", proto: "Redis", desc: "Reads cached policy data" },
    { id: "rel-107", type: "uses", from: "container.policy-api", to: "container.policy-workflow-engine", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Triggers policy lifecycle workflows" },
    { id: "rel-108", type: "uses", from: "container.policy-rating-api", to: "container.rating-tables", crit: "synchronous-critical", proto: "Redis", desc: "Reads rate tables" },
    { id: "rel-109", type: "uses", from: "container.policy-workflow-engine", to: "container.policy-event-bus", crit: "async", proto: "Kafka", desc: "Publishes workflow state changes" },
    { id: "rel-110", type: "stores_in", from: "container.policy-document-store", to: "container.policy-database", crit: "async", proto: "PostgreSQL", desc: "Stores document metadata" },

    // Policy capability relationships
    { id: "rel-111", type: "realized_by", from: "capability.underwriting", to: "system.policy-admin", desc: "Underwriting realized by Policy Admin" },
    { id: "rel-112", type: "realized_by", from: "capability.underwriting", to: "container.policy-rules-engine", desc: "Rules engine evaluates underwriting decisions" },
    { id: "rel-113", type: "realized_by", from: "capability.policy-lifecycle", to: "system.policy-admin", desc: "Policy lifecycle realized by Policy Admin" },
    { id: "rel-114", type: "realized_by", from: "capability.policy-lifecycle", to: "container.policy-workflow-engine", desc: "Workflow engine orchestrates lifecycle" },

    // Policy process relationships
    { id: "rel-115", type: "realized_by", from: "process.new-business-underwriting", to: "capability.underwriting", desc: "New business process realizes underwriting capability" },
    { id: "rel-116", type: "automated_by", from: "process.new-business-underwriting", to: "system.policy-admin", desc: "New business automated by Policy Admin" },
    { id: "rel-117", type: "uses", from: "process.new-business-underwriting", to: "system.policy-rating-engine", desc: "New business uses rating engine for quote" },
    { id: "rel-118", type: "realized_by", from: "process.policy-renewal", to: "capability.policy-lifecycle", desc: "Renewal realizes policy lifecycle capability" },
    { id: "rel-119", type: "automated_by", from: "process.policy-renewal", to: "system.policy-admin", desc: "Renewal automated by Policy Admin" },
    { id: "rel-120", type: "uses", from: "process.policy-renewal", to: "system.policy-rating-engine", desc: "Renewal uses rating engine for re-rating" },
    { id: "rel-121", type: "realized_by", from: "process.endorsement-processing", to: "capability.policy-lifecycle", desc: "Endorsement process realizes lifecycle capability" },
    { id: "rel-122", type: "automated_by", from: "process.endorsement-processing", to: "system.policy-admin", desc: "Endorsement automated by Policy Admin" },
    { id: "rel-123", type: "uses", from: "process.endorsement-processing", to: "system.billing", desc: "Endorsement triggers billing adjustment" },

    // Policy data entity relationships
    { id: "rel-124", type: "stores_in", from: "data_entity.policy-record", to: "container.policy-database", desc: "Policy records stored in policy database" },
    { id: "rel-125", type: "uses", from: "container.policy-api", to: "data_entity.policy-record", desc: "Policy API manages policy records" },
    { id: "rel-126", type: "stores_in", from: "data_entity.rate-table", to: "container.rating-tables", desc: "Rate tables stored in Redis cache" },
    { id: "rel-127", type: "uses", from: "container.policy-rating-api", to: "data_entity.rate-table", desc: "Rating API uses rate tables" },

    // Policy goal relationships
    { id: "rel-128", type: "supported_by", from: "goal.ensure-regulatory-compliance", to: "capability.underwriting", desc: "Underwriting supports compliance" },
    { id: "rel-129", type: "supported_by", from: "goal.ensure-regulatory-compliance", to: "capability.policy-lifecycle", desc: "Lifecycle management supports compliance" },

    // Policy actor relationships
    { id: "rel-130", type: "uses", from: "actor.underwriter", to: "system.policy-admin", crit: "synchronous-critical", desc: "Underwriter uses Policy Admin" },
    { id: "rel-131", type: "uses", from: "actor.member", to: "system.claims-portal", crit: "synchronous-critical", desc: "Member files claims via portal" },
    { id: "rel-132", type: "uses", from: "actor.member", to: "system.policy-admin", crit: "synchronous-critical", desc: "Member manages policies" },
    { id: "rel-133", type: "uses", from: "actor.member", to: "system.billing", crit: "synchronous-critical", desc: "Member makes payments" },
    { id: "rel-134", type: "uses", from: "actor.external-vendor", to: "system.claims-portal", crit: "async", desc: "Vendors interact via Claims Portal API" },

    // ── BILLING DOMAIN EXPANSION RELATIONSHIPS ──

    // New Billing containers → parent systems
    { id: "rel-135", type: "container_of", from: "system.payment-processor", to: "container.payment-processor-api", desc: "Contains" },
    { id: "rel-136", type: "container_of", from: "system.billing", to: "container.payment-ledger", desc: "Contains" },
    { id: "rel-137", type: "container_of", from: "system.billing", to: "container.billing-notification-service", desc: "Contains" },
    { id: "rel-138", type: "container_of", from: "system.billing", to: "container.billing-scheduler", desc: "Contains" },

    // Billing container-to-container dependencies
    { id: "rel-139", type: "uses", from: "container.billing-api", to: "container.payment-ledger", crit: "synchronous-critical", proto: "PostgreSQL", desc: "Reads/writes financial ledger" },
    { id: "rel-140", type: "uses", from: "container.billing-api", to: "container.payment-processor-api", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Processes payments via gateway" },
    { id: "rel-141", type: "uses", from: "container.billing-scheduler", to: "container.billing-api", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Triggers scheduled billing operations" },
    { id: "rel-142", type: "uses", from: "container.billing-scheduler", to: "container.billing-notification-service", crit: "async", desc: "Triggers billing notifications" },
    { id: "rel-143", type: "uses", from: "container.payment-processor-api", to: "container.payment-processor", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Delegates to core payment processor" },

    // Billing capability relationships
    { id: "rel-144", type: "realized_by", from: "capability.premium-collection", to: "system.billing", desc: "Premium collection realized by Billing System" },
    { id: "rel-145", type: "realized_by", from: "capability.premium-collection", to: "system.payment-processor", desc: "Premium collection uses Payment Processor" },
    { id: "rel-146", type: "realized_by", from: "capability.financial-reconciliation", to: "system.billing", desc: "Reconciliation realized by Billing System" },
    { id: "rel-147", type: "realized_by", from: "capability.financial-reconciliation", to: "container.payment-ledger", desc: "Ledger enables reconciliation" },

    // Billing process relationships
    { id: "rel-148", type: "realized_by", from: "process.premium-billing", to: "capability.premium-collection", desc: "Premium billing realizes collection capability" },
    { id: "rel-149", type: "automated_by", from: "process.premium-billing", to: "system.billing", desc: "Premium billing automated by Billing System" },
    { id: "rel-150", type: "uses", from: "process.premium-billing", to: "container.billing-scheduler", desc: "Premium billing uses scheduler" },
    { id: "rel-151", type: "realized_by", from: "process.payment-processing", to: "capability.premium-collection", desc: "Payment processing realizes collection capability" },
    { id: "rel-152", type: "automated_by", from: "process.payment-processing", to: "system.payment-processor", desc: "Payment processing automated by Payment Processor" },

    // Billing data entity relationships
    { id: "rel-153", type: "stores_in", from: "data_entity.payment-transaction", to: "container.payment-ledger", desc: "Payment transactions stored in ledger" },
    { id: "rel-154", type: "produces", from: "container.payment-processor-api", to: "data_entity.payment-transaction", desc: "Payment API produces transaction records" },

    // Billing standard governance
    { id: "rel-155", type: "governed_by", from: "system.billing", to: "standard.data-classification", desc: "Billing data governed by classification standard" },
    { id: "rel-156", type: "governed_by", from: "system.payment-processor", to: "standard.data-classification", desc: "Payment data governed by classification standard" },
    { id: "rel-157", type: "governed_by", from: "container.billing-api", to: "standard.api-design", desc: "Billing API follows API design standard" },
    { id: "rel-158", type: "governed_by", from: "container.billing-api", to: "standard.cloud-native", desc: "Billing API follows cloud-native standard" },

    // ── OPERATIONS DOMAIN EXPANSION RELATIONSHIPS ──

    // New Operations containers → parent systems
    { id: "rel-159", type: "container_of", from: "system.monitoring-platform", to: "container.monitoring-dashboard", desc: "Contains" },
    { id: "rel-160", type: "container_of", from: "system.monitoring-platform", to: "container.alert-manager", desc: "Contains" },
    { id: "rel-161", type: "container_of", from: "system.log-analytics", to: "container.log-collector", desc: "Contains" },
    { id: "rel-162", type: "container_of", from: "system.incident-management", to: "container.incident-tracker", desc: "Contains" },
    { id: "rel-163", type: "container_of", from: "system.deployment-platform", to: "container.deployment-pipeline", desc: "Contains" },
    { id: "rel-164", type: "container_of", from: "system.deployment-platform", to: "container.k8s-cluster", desc: "Contains" },

    // Operations container dependencies
    { id: "rel-165", type: "uses", from: "container.monitoring-dashboard", to: "container.alert-manager", crit: "synchronous-critical", desc: "Dashboard shows alert status" },
    { id: "rel-166", type: "uses", from: "container.alert-manager", to: "container.incident-tracker", crit: "synchronous-critical", proto: "REST/HTTPS", desc: "Creates incidents from alerts" },
    { id: "rel-167", type: "uses", from: "container.deployment-pipeline", to: "container.k8s-cluster", crit: "synchronous-critical", desc: "Deploys to Kubernetes" },
    { id: "rel-168", type: "uses", from: "container.log-collector", to: "system.log-analytics", crit: "async", desc: "Forwards logs to analytics" },

    // Operations capability relationships
    { id: "rel-169", type: "realized_by", from: "capability.observability", to: "system.monitoring-platform", desc: "Observability realized by Monitoring Platform" },
    { id: "rel-170", type: "realized_by", from: "capability.observability", to: "system.log-analytics", desc: "Observability realized by Log Analytics" },
    { id: "rel-171", type: "realized_by", from: "capability.release-management", to: "system.deployment-platform", desc: "Release management realized by Deployment Platform" },
    { id: "rel-172", type: "realized_by", from: "capability.incident-response", to: "system.incident-management", desc: "Incident response realized by Incident Management" },
    { id: "rel-173", type: "realized_by", from: "capability.incident-response", to: "system.monitoring-platform", desc: "Incident response uses monitoring for detection" },

    // Operations process relationships
    { id: "rel-174", type: "realized_by", from: "process.incident-management", to: "capability.incident-response", desc: "Incident management realizes incident response capability" },
    { id: "rel-175", type: "automated_by", from: "process.incident-management", to: "system.incident-management", desc: "Incident management automated by Incident Management System" },
    { id: "rel-176", type: "uses", from: "process.incident-management", to: "system.monitoring-platform", desc: "Incident management uses monitoring for detection" },
    { id: "rel-177", type: "realized_by", from: "process.change-management", to: "capability.release-management", desc: "Change management enables release management" },
    { id: "rel-178", type: "automated_by", from: "process.change-management", to: "system.deployment-platform", desc: "Change management uses deployment platform" },
    { id: "rel-179", type: "realized_by", from: "process.capacity-planning", to: "capability.observability", desc: "Capacity planning relies on observability data" },
    { id: "rel-180", type: "uses", from: "process.capacity-planning", to: "system.monitoring-platform", desc: "Capacity planning uses monitoring metrics" },

    // Operations goal relationships
    { id: "rel-181", type: "supported_by", from: "goal.operational-resilience", to: "capability.observability", desc: "Observability supports resilience" },
    { id: "rel-182", type: "supported_by", from: "goal.operational-resilience", to: "capability.incident-response", desc: "Incident response supports resilience" },
    { id: "rel-183", type: "supported_by", from: "goal.operational-resilience", to: "capability.release-management", desc: "Release management supports resilience" },
    { id: "rel-184", type: "supported_by", from: "goal.improve-member-experience", to: "capability.observability", desc: "Observability helps maintain experience SLAs" },
    { id: "rel-185", type: "supported_by", from: "goal.improve-member-experience", to: "capability.fnol", desc: "Fast FNOL improves member experience" },

    // Operations cross-domain monitoring
    { id: "rel-186", type: "uses", from: "system.monitoring-platform", to: "system.billing", crit: "non-critical", desc: "Monitors billing system health" },
    { id: "rel-187", type: "uses", from: "system.monitoring-platform", to: "system.payment-gateway", crit: "non-critical", desc: "Monitors payment gateway health" },
    { id: "rel-188", type: "uses", from: "system.log-analytics", to: "system.claims-processing", crit: "non-critical", desc: "Collects claims processing logs" },
    { id: "rel-189", type: "uses", from: "system.log-analytics", to: "system.policy-admin", crit: "non-critical", desc: "Collects policy admin logs" },
    { id: "rel-190", type: "uses", from: "system.log-analytics", to: "system.billing", crit: "non-critical", desc: "Collects billing system logs" },

    // Decision relationships
    { id: "rel-191", type: "constrains", from: "decision.event-driven-architecture", to: "container.event-router", desc: "EDA decision drives event router design" },
    { id: "rel-192", type: "constrains", from: "decision.event-driven-architecture", to: "container.policy-event-bus", desc: "EDA decision drives policy event bus" },
    { id: "rel-193", type: "constrains", from: "decision.api-gateway-pattern", to: "container.adjudication-api", desc: "API gateway pattern applies to adjudication API" },
    { id: "rel-194", type: "constrains", from: "decision.api-gateway-pattern", to: "container.policy-api", desc: "API gateway pattern applies to policy API" },
    { id: "rel-195", type: "constrains", from: "decision.api-gateway-pattern", to: "container.billing-api", desc: "API gateway pattern applies to billing API" },
    { id: "rel-196", type: "constrains", from: "decision.database-per-service", to: "container.claims-database", desc: "Database per service — claims" },
    { id: "rel-197", type: "constrains", from: "decision.database-per-service", to: "container.policy-database", desc: "Database per service — policy" },
    { id: "rel-198", type: "constrains", from: "decision.database-per-service", to: "container.billing-database", desc: "Database per service — billing" },
    { id: "rel-199", type: "constrains", from: "decision.database-per-service", to: "container.payment-ledger", desc: "Database per service — payment ledger" },

    // Standard governance for new entities
    { id: "rel-200", type: "governed_by", from: "container.policy-rating-api", to: "standard.api-design", desc: "Rating API follows API design standard" },
    { id: "rel-201", type: "governed_by", from: "container.policy-rating-api", to: "standard.cloud-native", desc: "Rating API follows cloud-native standard" },
    { id: "rel-202", type: "governed_by", from: "container.payment-processor-api", to: "standard.api-design", desc: "Payment API follows API design standard" },
    { id: "rel-203", type: "governed_by", from: "container.payment-processor-api", to: "standard.data-classification", desc: "Payment API follows data classification" },
    { id: "rel-204", type: "governed_by", from: "container.k8s-cluster", to: "standard.cloud-native", desc: "K8s cluster follows cloud-native standard" },
    { id: "rel-205", type: "governed_by", from: "container.deployment-pipeline", to: "standard.cloud-native", desc: "Deployment pipeline follows cloud-native standard" },

    // Cross-domain: Billing → Policy
    { id: "rel-206", type: "uses", from: "process.endorsement-processing", to: "process.premium-billing", desc: "Endorsement triggers billing adjustment" },
    { id: "rel-207", type: "uses", from: "process.policy-renewal", to: "system.billing", desc: "Renewal triggers billing schedule update" },
  ];

  for (const r of rels) {
    storage.createRelationship({
      eams_rel_id: r.id,
      rel_type: r.type,
      from_entity_id: r.from,
      to_entity_id: r.to,
      criticality: r.crit || "informational",
      protocol: r.proto || undefined,
      description: r.desc || undefined,
      branch: "main",
    });
  }

  // ══════════════════════════════════════════════════════════
  //  COMPLIANCE FINDINGS
  // ══════════════════════════════════════════════════════════

  storage.createComplianceFinding({
    entity_id: "system.legacy-claims-api", standard_id: "standard.rest-api-first",
    rule_id: "REST-001", severity: "violation",
    finding: "System uses SOAP/XML protocol instead of required REST API. Migration plan required by Q3 2026.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.legacy-claims-api", standard_id: "standard.aws-deployment",
    rule_id: "AWS-001", severity: "violation",
    finding: "System is deployed on-premises (DC2) instead of AWS. Cloud migration plan needed.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "container.document-storage-service", standard_id: "standard.pii-data-handling",
    rule_id: "PII-003", severity: "warning",
    finding: "Document storage service handles PHI data but encryption-at-rest configuration has not been verified in the last 90 days.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.claims-processing", standard_id: "standard.pii-data-handling",
    rule_id: "PII-007", severity: "warning",
    finding: "Claims processing system PII audit logging configuration needs review. Last audit log rotation was 95 days ago.",
    deterministic: 0, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "container.adjudication-api", standard_id: "standard.rest-api-first",
    rule_id: "REST-005", severity: "advisory",
    finding: "API documentation is 45 days out of date. Recommend updating OpenAPI spec to reflect recent endpoint changes.",
    deterministic: 0, compile_id: "compile-001", branch: "main",
  });

  // ══════════════════════════════════════════════════════════
  //  VIEWPOINT DEFINITIONS
  // ══════════════════════════════════════════════════════════

  storage.createViewpoint({
    viewpoint_id: "viewpoint.c4-context", name: "C4 System Context",
    description: "Shows a system in its environment — actors, neighboring systems, and their interactions. The classic C4 Level 1 view.",
    scope_strategy: "parameter-seed",
    stakeholders: JSON.stringify(["solution-architect", "engineering-manager", "cto"]),
    parameters: JSON.stringify({ entity_id: { type: "string", description: "The system to center the view on" } }),
    scope_config: JSON.stringify({ seed: "entity_id", expand: "neighbors" }),
    include_rules: JSON.stringify([]),
    filters: JSON.stringify({ kinds: ["system", "actor", "container"] }),
    styling: JSON.stringify({ nodeColors: { system: "#1B3A5C", actor: "#4A5568" } }),
    layout: JSON.stringify({ type: "force-directed", gravity: 0.3 }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.c4-container", name: "C4 Container View",
    description: "Shows the internal containers of a system — APIs, databases, message queues, UIs — and their relationships.",
    scope_strategy: "parameter-seed",
    stakeholders: JSON.stringify(["solution-architect", "tech-lead", "developer"]),
    parameters: JSON.stringify({ entity_id: { type: "string", description: "The system to show containers for" } }),
    scope_config: JSON.stringify({ seed: "entity_id", expand: "containers" }),
    include_rules: JSON.stringify([{ rel_types: ["container_of", "uses", "stores_in", "reads_from", "publishes_to", "subscribes_to"], kinds: ["container", "system", "actor"] }]),
    filters: JSON.stringify({}),
    styling: JSON.stringify({ nodeColors: { container: "#0F7173", system: "#1B3A5C" } }),
    layout: JSON.stringify({ type: "hierarchical", direction: "TB" }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.capability-map", name: "Capability Heat Map",
    description: "Maps business capabilities to the systems and processes that realize them. Heat-colored by maturity or risk.",
    scope_strategy: "domain-query",
    stakeholders: JSON.stringify(["enterprise-architect", "business-analyst", "cto"]),
    parameters: JSON.stringify({ domain: { type: "string" } }),
    scope_config: JSON.stringify({ query: { kinds: ["capability", "system", "process"] } }),
    include_rules: JSON.stringify([{ rel_types: ["realized_by", "supported_by"] }]),
    filters: JSON.stringify({ kinds: ["capability", "system", "process", "goal"] }),
    styling: JSON.stringify({}),
    layout: JSON.stringify({ type: "grid", columns: 3 }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.blast-radius", name: "Blast Radius",
    description: "Shows the impact radius of a system failure — all directly and transitively dependent systems, capabilities, and processes.",
    scope_strategy: "parameter-seed",
    stakeholders: JSON.stringify(["solution-architect", "sre", "risk-officer"]),
    parameters: JSON.stringify({ entity_id: { type: "string" } }),
    scope_config: JSON.stringify({ seed: "entity_id", expand: "dependents", depth: 3 }),
    include_rules: JSON.stringify([{ rel_types: ["uses", "consumes", "subscribes_to", "reads_from", "realized_by"] }]),
    filters: JSON.stringify({}),
    styling: JSON.stringify({ emphasize_criticality: true }),
    layout: JSON.stringify({ type: "radial", center: "seed" }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.domain-interactions", name: "Domain Interaction Map",
    description: "Shows how domains interact through their systems. Cross-domain dependencies and integration points.",
    scope_strategy: "entity-query",
    stakeholders: JSON.stringify(["enterprise-architect", "domain-architect"]),
    parameters: JSON.stringify({}),
    scope_config: JSON.stringify({ query: { kinds: ["system"] } }),
    include_rules: JSON.stringify([]),
    filters: JSON.stringify({ kinds: ["system"] }),
    styling: JSON.stringify({}),
    layout: JSON.stringify({ type: "force-directed", groupBy: "domain" }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.integration-surface", name: "System Integration Surface",
    description: "Shows all integration points for a system — incoming and outgoing APIs, events, and data flows.",
    scope_strategy: "parameter-seed",
    stakeholders: JSON.stringify(["integration-architect", "tech-lead"]),
    parameters: JSON.stringify({ entity_id: { type: "string" } }),
    scope_config: JSON.stringify({ seed: "entity_id", expand: "all-connections" }),
    include_rules: JSON.stringify([{ rel_types: ["uses", "consumes", "publishes_to", "subscribes_to", "invokes"] }]),
    filters: JSON.stringify({}),
    styling: JSON.stringify({ highlight_protocols: true }),
    layout: JSON.stringify({ type: "force-directed" }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  storage.createViewpoint({
    viewpoint_id: "viewpoint.tier1-dependency", name: "Tier-1 Dependency Graph",
    description: "Shows all tier-1 critical systems and their dependencies. Highlights single points of failure.",
    scope_strategy: "entity-query",
    stakeholders: JSON.stringify(["enterprise-architect", "cto", "sre"]),
    parameters: JSON.stringify({}),
    scope_config: JSON.stringify({ query: { criticality: "tier-1" } }),
    include_rules: JSON.stringify([{ rel_types: ["uses", "stores_in", "reads_from"] }]),
    filters: JSON.stringify({ criticality: ["tier-1"] }),
    styling: JSON.stringify({ emphasize_criticality: true }),
    layout: JSON.stringify({ type: "force-directed" }),
    output_config: JSON.stringify({ format: "render-graph" }),
    version: "1.0",
  });

  // ══════════════════════════════════════════════════════════
  //  ADVISORY OUTPUTS
  // ══════════════════════════════════════════════════════════

  storage.createAdvisoryOutput({
    advisory_id: "advisory-001",
    output_type: "compliance_assessment",
    scope_entity_id: "system.legacy-claims-api",
    scope_mode: "entity",
    branch: "main",
    status: "pending",
    model_tier: "tier-2",
    content: JSON.stringify({
      summary: "Legacy Claims API has significant compliance gaps",
      overall_risk: "high",
      findings: [
        { category: "API Standards", severity: "violation", detail: "System uses SOAP/XML instead of mandated REST. No migration plan documented." },
        { category: "Deployment", severity: "violation", detail: "On-premises deployment violates cloud-first mandate. Migration cost estimated at $450K." },
        { category: "Security", severity: "warning", detail: "Java 8 runtime has 23 known CVEs. Upgrade to Java 17+ required." },
        { category: "Data Handling", severity: "warning", detail: "PII data handling practices not verified against current standards." },
      ],
      recommendations: [
        "Prioritize decommission timeline — recommend Q2 2026 instead of Q3 2026",
        "Implement API gateway facade to redirect traffic to new Claims Processing System",
        "Conduct security audit before any further integration partner onboarding",
      ],
    }),
    data_gaps: JSON.stringify(["Missing recent penetration test results", "Partner integration traffic breakdown unavailable"]),
    generated_at: "2026-03-15T10:30:00Z",
  });

  storage.createAdvisoryOutput({
    advisory_id: "advisory-002",
    output_type: "explanation",
    scope_entity_id: "decision.adr-0042",
    scope_mode: "entity",
    branch: "main",
    status: "completed",
    disposition: "accepted",
    model_tier: "tier-1",
    content: JSON.stringify({
      summary: "ADR-0042 proposes real-time adjudication for auto claims under $5,000",
      explanation: "This architectural decision shifts claim adjudication from a batch-oriented queue model to a synchronous fast-path for low-value auto claims. The rationale is to reduce cycle time from 3-5 business days to under 4 hours for ~35% of auto claims volume. The trade-off is increased complexity in the adjudication API (dual code paths) and higher infrastructure costs for real-time capacity. The decision aligns with the strategic goal of reducing claims cycle time.",
      impact_analysis: {
        affected_systems: ["system.claims-processing", "container.adjudication-api", "container.rules-engine"],
        risk_level: "medium",
        implementation_effort: "2-3 sprints",
      },
    }),
    generated_at: "2026-02-20T14:00:00Z",
    acknowledged_at: "2026-02-22T09:15:00Z",
    acknowledged_by: "sarah.chen@company.com",
  });

  storage.createAdvisoryOutput({
    advisory_id: "advisory-003",
    output_type: "risk_identification",
    scope_entity_id: "system.claims-processing",
    scope_mode: "entity",
    branch: "main",
    status: "pending",
    model_tier: "tier-2",
    content: JSON.stringify({
      summary: "Risk assessment for Claims Processing System",
      risks: [
        { id: "RISK-001", title: "Single point of failure in Rules Engine", severity: "high", likelihood: "medium", detail: "The Rules Engine (Drools) has no failover configuration. A failure would halt all adjudication processing.", mitigation: "Implement active-passive failover with health check routing." },
        { id: "RISK-002", title: "Database connection pool exhaustion", severity: "medium", likelihood: "low", detail: "Under peak load (month-end), connection pool utilization reaches 85%. Spike events could cause timeouts.", mitigation: "Increase pool size from 50 to 100 and implement connection pooling with PgBouncer." },
        { id: "RISK-003", title: "Kafka consumer lag during peak", severity: "medium", likelihood: "medium", detail: "Event router consumer lag exceeds 30 seconds during peak processing, causing delayed notifications.", mitigation: "Scale consumer group and optimize message processing batch size." },
      ],
    }),
    data_gaps: JSON.stringify(["Load test results from last 90 days not available", "Disaster recovery test date unknown"]),
    generated_at: "2026-03-20T16:45:00Z",
  });

  // ══════════════════════════════════════════════════════════
  //  BRANCHES
  // ══════════════════════════════════════════════════════════

  storage.createBranch({
    branch_name: "project/claims-rt-adjudication",
    intent: "project",
    description: "Real-time adjudication implementation for auto claims under $5,000. Adds fast-path processing in the Adjudication API.",
    review_status: "in-review",
    author: "sarah.chen@company.com",
    base_branch: "main",
    created_at: "2026-03-01T09:00:00Z",
  });

  storage.createBranch({
    branch_name: "proposal/billing-modernization",
    intent: "proposal",
    description: "Proposal to modernize the billing system from monolithic to microservices architecture with event-driven payment processing.",
    review_status: "draft",
    author: "priya.patel@company.com",
    base_branch: "main",
    created_at: "2026-03-10T14:00:00Z",
  });

  // Branch entities (modifications on branches)
  storage.createEntity({
    eams_id: "container.rt-adjudication-service", kind: "container", name: "RT Adjudication Service",
    domain: "claims", status: "proposed",
    description: "New real-time adjudication microservice for fast-path claim processing. Handles auto claims under $5,000 with sub-second response time.",
    parent_system_id: "system.claims-processing", container_type: "api",
    technology_primary: "Java/Spring Boot", technology_language: "Java 17",
    technology_hosting: "AWS ECS Fargate",
    criticality: "tier-1",
    nfr_latency: "p99 < 500ms", nfr_availability: "99.95%",
    compliance_status: "unchecked",
    branch: "project/claims-rt-adjudication", content_hash: "branch001",
    metadata_created: "2026-03-01",
  });

  storage.createEntity({
    eams_id: "container.billing-event-processor", kind: "container", name: "Billing Event Processor",
    domain: "billing", status: "proposed",
    description: "New event-driven billing processor replacing batch billing runs. Processes billing events in real-time.",
    parent_system_id: "system.billing", container_type: "worker",
    technology_primary: "Node.js", technology_language: "TypeScript",
    technology_hosting: "AWS ECS Fargate",
    compliance_status: "unchecked",
    branch: "proposal/billing-modernization", content_hash: "branch002",
    metadata_created: "2026-03-10",
  });

  // ══════════════════════════════════════════════════════════
  //  COMPILE RECORDS
  // ══════════════════════════════════════════════════════════

  storage.createCompileRecord({
    compile_id: "compile-001",
    branch: "main",
    git_sha: "a1b2c3d4e5f6",
    trigger: "cli",
    outcome: "success",
    entities_total: 52,
    entities_passed: 50,
    entities_blocked: 2,
    diff_added: 0,
    diff_modified: 3,
    diff_removed: 0,
    errors: JSON.stringify([]),
    compliance_findings: JSON.stringify({ violations: 2, warnings: 3, advisories: 1 }),
    blocked_entities: JSON.stringify(["system.legacy-claims-api"]),
    stage_timings: JSON.stringify({
      parse: 120, validate: 340, normalize: 85, resolve: 210,
      compile: 450, compliance: 180, diff: 95, publish: 60,
    }),
    started_at: "2026-03-28T22:00:00Z",
    completed_at: "2026-03-28T22:00:02Z",
  });

  storage.createCompileRecord({
    compile_id: "compile-002",
    branch: "project/claims-rt-adjudication",
    git_sha: "f6e5d4c3b2a1",
    trigger: "manual",
    outcome: "partial_success",
    entities_total: 53,
    entities_passed: 51,
    entities_blocked: 2,
    diff_added: 1,
    diff_modified: 2,
    diff_removed: 0,
    errors: JSON.stringify([{ entity: "container.rt-adjudication-service", error: "Missing NFR encryption specification" }]),
    compliance_findings: JSON.stringify({ violations: 2, warnings: 4, advisories: 1 }),
    blocked_entities: JSON.stringify(["system.legacy-claims-api"]),
    stage_timings: JSON.stringify({
      parse: 130, validate: 360, normalize: 90, resolve: 220,
      compile: 480, compliance: 200, diff: 110, publish: 65,
    }),
    started_at: "2026-03-28T23:30:00Z",
    completed_at: "2026-03-28T23:30:03Z",
  });

  // ══════════════════════════════════════════════════════════
  //  SIGNALS
  // ══════════════════════════════════════════════════════════

  storage.createSignal({
    signal_id: "signal-001", signal_type: "incident", source: "PagerDuty", source_id: "PD-45231",
    title: "Claims Processing System — Elevated Error Rate",
    description: "Error rate increased to 2.3% (threshold: 1%) on the Adjudication API. Root cause: database connection pool exhaustion during month-end batch processing.",
    affected_entities: JSON.stringify(["system.claims-processing", "container.adjudication-api", "container.claims-database"]),
    severity: "high", timestamp: "2026-03-27T14:22:00Z",
  });

  storage.createSignal({
    signal_id: "signal-002", signal_type: "performance", source: "Datadog", source_id: "DD-METRIC-8842",
    title: "Event Router — Consumer Lag Warning",
    description: "Kafka consumer lag exceeded 45 seconds on the claims-events topic. Normal threshold is 10 seconds. Caused by increased FNOL volume from storm event.",
    affected_entities: JSON.stringify(["container.event-router", "container.claims-notification-service"]),
    severity: "medium", timestamp: "2026-03-26T09:15:00Z",
  });

  storage.createSignal({
    signal_id: "signal-003", signal_type: "lifecycle", source: "AWS", source_id: "AWS-EOL-2026-Q2",
    title: "Java 8 End of Support — Legacy Claims API",
    description: "AWS Corretto 8 extended support ends Q2 2026. Legacy Claims API must be migrated or upgraded before June 30, 2026.",
    affected_entities: JSON.stringify(["system.legacy-claims-api"]),
    severity: "high", timestamp: "2026-03-15T08:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-004", signal_type: "compliance", source: "ComplianceBot", source_id: "CB-SCAN-1204",
    title: "PII Data Handling — Document Storage Encryption Review Overdue",
    description: "Quarterly encryption configuration review for Document Storage Service is 15 days overdue. Required by PII Data Handling Standard.",
    affected_entities: JSON.stringify(["container.document-storage-service"]),
    severity: "medium", timestamp: "2026-03-20T10:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-005", signal_type: "feedback", source: "Architecture Review Board", source_id: "ARB-2026-Q1-03",
    title: "ARB Feedback — Claims Data Platform Architecture",
    description: "Architecture Review Board recommends implementing data lineage tracking in the Claims Data Platform to improve audit trail for regulatory reporting.",
    affected_entities: JSON.stringify(["system.claims-data-platform"]),
    severity: "low", timestamp: "2026-03-22T16:30:00Z",
  });

  storage.createSignal({
    signal_id: "signal-006", signal_type: "change", source: "GitHub Actions", source_id: "GHA-deploy-4417",
    title: "Policy Rating Engine — Production Deployment v2.14.0",
    description: "Automated deployment of Policy Rating Engine v2.14.0 to production. Changes include updated actuarial tables for Q2 2026 and improved caching strategy for rating factor lookups.",
    affected_entities: JSON.stringify(["system.policy-rating-engine", "container.rating-api", "container.rating-tables"]),
    severity: "low", timestamp: "2026-03-28T06:15:00Z",
  });

  storage.createSignal({
    signal_id: "signal-007", signal_type: "incident", source: "ServiceNow", source_id: "SN-INC-78432",
    title: "Payment Gateway — Intermittent Timeout Errors",
    description: "Payment Gateway experiencing intermittent 504 timeouts during peak hours (2-4 PM EST). Affecting approximately 3% of payment transactions. Root cause investigation points to Stripe API rate limiting.",
    affected_entities: JSON.stringify(["system.payment-gateway", "container.payment-processor", "system.billing"]),
    severity: "critical", timestamp: "2026-03-29T14:45:00Z",
  });

  storage.createSignal({
    signal_id: "signal-008", signal_type: "performance", source: "New Relic", source_id: "NR-ALERT-22190",
    title: "Claims Portal — Frontend Bundle Size Regression",
    description: "Claims Web UI bundle size increased 34% (from 1.2MB to 1.6MB) after recent dependency update. Page load time p95 increased from 2.1s to 3.4s. Recommend tree-shaking audit.",
    affected_entities: JSON.stringify(["system.claims-portal", "container.claims-web-ui"]),
    severity: "medium", timestamp: "2026-03-27T11:30:00Z",
  });

  storage.createSignal({
    signal_id: "signal-009", signal_type: "lifecycle", source: "AWS", source_id: "AWS-RDS-NOTIFY-2026-04",
    title: "Aurora PostgreSQL 13 — End of Standard Support",
    description: "Aurora PostgreSQL 13 reaches end of standard support on April 30, 2026. Policy Database and Claims Database clusters must be upgraded to PostgreSQL 15+ before this date to avoid forced upgrades.",
    affected_entities: JSON.stringify(["container.claims-database", "container.policy-database"]),
    severity: "high", timestamp: "2026-03-25T09:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-010", signal_type: "compliance", source: "Prisma Cloud", source_id: "PC-DRIFT-8841",
    title: "Billing API — IAM Policy Drift Detected",
    description: "Billing API ECS task role has 4 permissions not declared in infrastructure-as-code. Manual IAM changes detected: s3:PutObject, sqs:SendMessage, kms:Decrypt, logs:CreateLogStream. Remediation required within 7 days per security policy.",
    affected_entities: JSON.stringify(["container.billing-api", "system.billing"]),
    severity: "high", timestamp: "2026-03-28T08:20:00Z",
  });

  storage.createSignal({
    signal_id: "signal-011", signal_type: "change", source: "Harness", source_id: "HARNESS-PIPE-6623",
    title: "Claims Notification Service — Config Change (Email Templates)",
    description: "Email template configuration updated for Claims Notification Service. 3 templates modified: claim-submitted, claim-approved, settlement-complete. Change deployed via Harness pipeline.",
    affected_entities: JSON.stringify(["container.claims-notification-service", "system.claims-processing"]),
    severity: "low", timestamp: "2026-03-29T10:05:00Z",
  });

  storage.createSignal({
    signal_id: "signal-012", signal_type: "feedback", source: "Architecture Review Board", source_id: "ARB-2026-Q1-07",
    title: "ARB Recommendation — Billing System Event Sourcing",
    description: "Architecture Review Board reviewed the billing modernization proposal and recommends adopting event sourcing pattern for financial transactions to ensure complete audit trail and enable temporal queries.",
    affected_entities: JSON.stringify(["system.billing", "system.payment-gateway"]),
    severity: "low", timestamp: "2026-03-26T15:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-013", signal_type: "performance", source: "Datadog", source_id: "DD-CAT-2026-Q1",
    title: "CAT Claims Surge — Processing Latency Elevated",
    description: "Catastrophe event CAT-2026-TX-HAIL declared. FNOL intake volume 8x normal. Adjudication queue depth at 2,400 (normal: 300). Average processing latency 4.2 hours (SLA: 2 hours). Surge staffing protocol activated.",
    affected_entities: JSON.stringify(["process.cat-claims", "system.claims-processing", "container.adjudication-api", "container.event-router"]),
    severity: "high", timestamp: "2026-03-29T16:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-014", signal_type: "compliance", source: "ComplianceBot", source_id: "CB-SUBRO-1205",
    title: "Subrogation Recovery Rate Below Target",
    description: "Q1 2026 subrogation recovery rate at 54% against 62% target. Root cause: delayed demand letters on 3rd-party at-fault claims. Recommendation: automate demand letter generation via Rules Engine integration.",
    affected_entities: JSON.stringify(["process.subrogation-recovery", "capability.subrogation", "system.claims-processing"]),
    severity: "medium", timestamp: "2026-03-28T10:30:00Z",
  });

  // New signals from Data Expansion Spec
  storage.createSignal({
    signal_id: "signal-015", signal_type: "performance", source: "Datadog", source_id: "DD-METRIC-9103",
    title: "Policy Rating Engine — Cache Miss Rate Elevated",
    description: "Redis cache miss rate for rate table lookups increased from 5% to 28% following Q2 actuarial table refresh. Rating API latency p99 increased from 80ms to 340ms. Recommend cache warm-up procedure after table updates.",
    affected_entities: JSON.stringify(["system.policy-rating-engine", "container.policy-rating-api", "container.rating-tables", "container.policy-cache"]),
    severity: "medium", timestamp: "2026-03-30T08:45:00Z",
  });

  storage.createSignal({
    signal_id: "signal-016", signal_type: "change", source: "Harness", source_id: "HARNESS-PIPE-7201",
    title: "Underwriting Rules Update Deployed",
    description: "Policy Rules Engine updated with 47 new underwriting rules for specialty lines. Deployment via Harness pipeline with canary release strategy. 0% error rate during canary phase.",
    affected_entities: JSON.stringify(["container.policy-rules-engine", "system.policy-admin"]),
    severity: "low", timestamp: "2026-03-29T07:30:00Z",
  });

  storage.createSignal({
    signal_id: "signal-017", signal_type: "compliance", source: "QualysGuard", source_id: "QG-PCI-2026-Q1",
    title: "Payment Gateway — PCI Scan Passed",
    description: "Quarterly PCI DSS external vulnerability scan completed successfully. All 14 critical controls passed. Next scan scheduled for Q2 2026.",
    affected_entities: JSON.stringify(["system.payment-gateway", "container.payment-processor", "system.payment-processor"]),
    severity: "low", timestamp: "2026-03-25T12:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-018", signal_type: "incident", source: "PagerDuty", source_id: "PD-48901",
    title: "Auto-Pay Processing Delayed — Bank Holiday",
    description: "Billing scheduler auto-pay batch failed to process 12,400 ACH transactions due to Federal Reserve holiday (Cesar Chavez Day). Transactions queued and will process next business day. No customer impact — grace period covers delay.",
    affected_entities: JSON.stringify(["container.billing-scheduler", "system.billing", "process.premium-billing"]),
    severity: "medium", timestamp: "2026-03-31T06:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-019", signal_type: "performance", source: "AWS CloudWatch", source_id: "CW-ASG-EKS-2026",
    title: "K8s Cluster — Node AutoScaling Triggered",
    description: "Karpenter triggered node autoscaling — added 4 m6i.2xlarge nodes to handle increased workload from month-end batch processing. Cluster utilization peaked at 82%. Nodes will scale down after 30 min idle.",
    affected_entities: JSON.stringify(["container.k8s-cluster", "system.deployment-platform"]),
    severity: "medium", timestamp: "2026-03-31T22:15:00Z",
  });

  storage.createSignal({
    signal_id: "signal-020", signal_type: "incident", source: "Harness", source_id: "HARNESS-CANARY-FAIL-441",
    title: "Deployment Pipeline — Failed Canary Detected",
    description: "Canary deployment of Claims Reporting Service v3.8.0 failed health check. Error rate 12% (threshold: 2%). Automatic rollback triggered. Root cause: incompatible dbt model change. No production impact.",
    affected_entities: JSON.stringify(["container.deployment-pipeline", "container.claims-reporting-service", "system.deployment-platform"]),
    severity: "high", timestamp: "2026-03-30T15:20:00Z",
  });

  storage.createSignal({
    signal_id: "signal-021", signal_type: "feedback", source: "Architecture Review Board", source_id: "ARB-2026-Q1-ANNUAL",
    title: "Annual Architecture Review Completed",
    description: "Annual enterprise architecture review completed. Key findings: 1) Legacy Claims API decommission on track, 2) Billing modernization proposal approved for Q3, 3) Operations observability rated 'mature', 4) Policy domain needs improved test coverage. Overall maturity score: 3.7/5.0.",
    affected_entities: JSON.stringify(["system.legacy-claims-api", "system.billing", "system.monitoring-platform", "system.policy-admin"]),
    severity: "low", timestamp: "2026-03-28T17:00:00Z",
  });

  storage.createSignal({
    signal_id: "signal-022", signal_type: "lifecycle", source: "Security Scanner", source_id: "SEC-TLS-SCAN-2026",
    title: "Legacy Claims API — TLS 1.0 Deprecation Warning",
    description: "Security scan detected TLS 1.0 still enabled on Legacy Claims API endpoints. Industry standard requires TLS 1.2 minimum. 3 partner integrations still using TLS 1.0: PartnerA (15% traffic), PartnerB (8%), PartnerC (2%). Deprecation deadline: June 30, 2026.",
    affected_entities: JSON.stringify(["system.legacy-claims-api"]),
    severity: "high", timestamp: "2026-03-29T09:00:00Z",
  });

  // ══════════════════════════════════════════════════════════
  //  ADDITIONAL COMPLIANCE FINDINGS
  // ══════════════════════════════════════════════════════════

  storage.createComplianceFinding({
    entity_id: "container.policy-rating-api", standard_id: "standard.api-design",
    rule_id: "API-002", severity: "warning",
    finding: "Policy Rating API missing rate limiting configuration. API design standard requires rate limiting on all external-facing endpoints. Current traffic: 800 req/s peak.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.payment-gateway", standard_id: "standard.data-classification",
    rule_id: "DATA-001", severity: "violation",
    finding: "PCI DSS quarterly external vulnerability scan is 12 days overdue. Data classification standard requires quarterly scans with results uploaded within 5 business days of completion.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.claims-portal", standard_id: "standard.api-design",
    rule_id: "WCAG-001", severity: "warning",
    finding: "Claims Portal has 7 WCAG 2.1 AA accessibility violations: missing alt text on 3 images, insufficient color contrast on 2 buttons, missing form labels on 2 inputs.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "container.billing-api", standard_id: "standard.cloud-native",
    rule_id: "CN-003", severity: "warning",
    finding: "Billing API missing /health endpoint. Cloud-native standard requires liveness and readiness health check endpoints for all containerized services.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.log-analytics", standard_id: "standard.data-classification",
    rule_id: "DATA-004", severity: "advisory",
    finding: "Log Analytics retaining raw logs for 120 days, exceeding the 90-day hot retention policy. Review retention configuration and archive older logs to cold storage.",
    deterministic: 0, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "system.legacy-claims-api", standard_id: "standard.api-design",
    rule_id: "API-005", severity: "violation",
    finding: "Legacy Claims API using deprecated TLS 1.0. API design standard mandates TLS 1.2 minimum for all API endpoints. 3 partner integrations still on TLS 1.0.",
    deterministic: 1, compile_id: "compile-001", branch: "main",
  });

  storage.createComplianceFinding({
    entity_id: "container.deployment-pipeline", standard_id: "standard.cloud-native",
    rule_id: "CN-007", severity: "advisory",
    finding: "Deployment pipeline missing documented rollback procedure for database migrations. Cloud-native standard requires rollback documentation for all deployment artifacts.",
    deterministic: 0, compile_id: "compile-001", branch: "main",
  });

  console.log("✓ Database seeded with EAMS sample data");
}
