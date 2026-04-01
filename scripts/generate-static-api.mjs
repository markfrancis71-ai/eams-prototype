/**
 * Static API Generator for Netlify deployment.
 *
 * Starts the Express server, fetches all API endpoints,
 * and saves responses as static JSON files in dist/public/api/.
 */
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 5555;
const BASE = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(process.cwd(), "dist", "public", "api");

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveJSON(filePath, data) {
  const fullPath = path.join(OUTPUT_DIR, filePath);
  mkdirp(path.dirname(fullPath));
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

async function fetchJSON(urlPath) {
  const res = await fetch(`${BASE}${urlPath}`);
  if (!res.ok) {
    console.warn(`  WARN: ${urlPath} returned ${res.status}`);
    return null;
  }
  return res.json();
}

async function postJSON(urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn(`  WARN: POST ${urlPath} returned ${res.status}`);
    return null;
  }
  return res.json();
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE}/api/domains`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error("Server failed to start within 15 seconds");
}

async function main() {
  console.log("=== Static API Generator ===\n");

  // Clean output dir
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  mkdirp(OUTPUT_DIR);

  // Delete old DB so seed runs fresh
  for (const dbName of ["data.db", "sqlite.db", "data.db-wal", "data.db-shm"]) {
    const dbPath = path.join(process.cwd(), dbName);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log(`Deleted ${dbName}`);
    }
  }

  // Push schema (initialize DB with WAL mode first to avoid SQLITE_IOERR)
  console.log("Pushing database schema...");
  execSync("sqlite3 data.db 'PRAGMA journal_mode=WAL;'", { stdio: "inherit", cwd: process.cwd() });
  execSync("npx drizzle-kit push", { stdio: "inherit", cwd: process.cwd() });

  // Start server using tsx (avoids native module bundling issues with esbuild)
  console.log(`\nStarting server on port ${PORT}...`);
  const server = spawn("npx", ["tsx", "server/index.ts"], {
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT) },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverOutput = "";
  server.stdout.on("data", (d) => { serverOutput += d.toString(); });
  server.stderr.on("data", (d) => { serverOutput += d.toString(); });

  try {
    await waitForServer();
    console.log("Server is ready.\n");

    // ═══════════════════════════════════════════
    //  FETCH ALL GET ENDPOINTS
    // ═══════════════════════════════════════════

    // 1. Domains
    console.log("Fetching /api/domains...");
    const domains = await fetchJSON("/api/domains");
    saveJSON("domains.json", domains);

    // 2. Search (empty query = all entities)
    console.log("Fetching /api/search?q= (all entities)...");
    const allEntities = await fetchJSON("/api/search?q=");
    saveJSON("search.json", allEntities);

    // 3. Domain entities
    for (const domain of (domains || [])) {
      console.log(`Fetching /api/domains/${domain}/entities...`);
      const domainEntities = await fetchJSON(`/api/domains/${domain}/entities`);
      saveJSON(`domains/${domain}/entities.json`, domainEntities);
    }

    // 4. Per-entity endpoints
    const entityIds = (allEntities || []).map(e => e.eams_id);
    console.log(`\nFetching data for ${entityIds.length} entities...`);
    for (const eamsId of entityIds) {
      const encoded = encodeURIComponent(eamsId);

      // Entity detail
      const entity = await fetchJSON(`/api/entities/${encoded}`);
      saveJSON(`entities/${eamsId}.json`, entity);

      // Context bundle
      const bundle = await fetchJSON(`/api/entities/${encoded}/context-bundle`);
      saveJSON(`entities/${eamsId}/context-bundle.json`, bundle);

      // Relationships
      const rels = await fetchJSON(`/api/entities/${encoded}/relationships`);
      saveJSON(`entities/${eamsId}/relationships.json`, rels);

      // Lineage up and down
      const lineageUp = await fetchJSON(`/api/graph/lineage/${encoded}?direction=up`);
      saveJSON(`graph/lineage/${eamsId}/up.json`, lineageUp);

      const lineageDown = await fetchJSON(`/api/graph/lineage/${encoded}?direction=down`);
      saveJSON(`graph/lineage/${eamsId}/down.json`, lineageDown);

      // Default lineage (no direction param)
      const lineageDefault = await fetchJSON(`/api/graph/lineage/${encoded}`);
      saveJSON(`graph/lineage/${eamsId}.json`, lineageDefault);
    }

    // 5. Signals
    console.log("\nFetching /api/signals...");
    const signals = await fetchJSON("/api/signals");
    saveJSON("signals.json", signals);

    // 6. Viewpoints
    console.log("Fetching /api/viewpoints...");
    const viewpoints = await fetchJSON("/api/viewpoints");
    saveJSON("viewpoints.json", viewpoints);

    for (const vp of (viewpoints || [])) {
      const vpId = encodeURIComponent(vp.viewpoint_id);
      const vpDetail = await fetchJSON(`/api/viewpoints/${vpId}`);
      saveJSON(`viewpoints/${vp.viewpoint_id}.json`, vpDetail);

      // Resolve for known systems
      const systems = entityIds.filter(id => id.startsWith("system."));
      for (const sysId of systems) {
        const resolved = await fetchJSON(`/api/viewpoints/${vpId}/resolve?system=${encodeURIComponent(sysId)}`);
        if (resolved) {
          saveJSON(`viewpoints/${vp.viewpoint_id}/resolve/${sysId}.json`, resolved);
        }
      }
    }

    // 7. Branches
    console.log("Fetching /api/branches...");
    const branches = await fetchJSON("/api/branches");
    saveJSON("branches.json", branches);

    for (const branch of (branches || [])) {
      const branchName = branch.branch_name;
      const branchDetail = await fetchJSON(`/api/branches/${encodeURIComponent(branchName)}`);
      saveJSON(`branches/${branchName}.json`, branchDetail);

      const diff = await fetchJSON(`/api/diff/${encodeURIComponent(branchName)}`);
      saveJSON(`diff/${branchName}.json`, diff);
    }

    // 8. Advisory
    console.log("Fetching /api/advisory...");
    const advisories = await fetchJSON("/api/advisory");
    saveJSON("advisory.json", advisories);

    for (const adv of (advisories || [])) {
      const advDetail = await fetchJSON(`/api/advisory/${encodeURIComponent(adv.advisory_id)}`);
      saveJSON(`advisory/${adv.advisory_id}.json`, advDetail);
    }

    // 9. Compile status & records
    console.log("Fetching /api/compile/status and records...");
    const compileStatus = await fetchJSON("/api/compile/status");
    saveJSON("compile/status.json", compileStatus);

    const compileRecords = await fetchJSON("/api/compile/records");
    saveJSON("compile/records.json", compileRecords);

    // 10. Metamodel
    console.log("Fetching /api/metamodel...");
    const metamodel = await fetchJSON("/api/metamodel");
    saveJSON("metamodel.json", metamodel);

    // 11. Health
    console.log("Fetching /api/health...");
    const health = await fetchJSON("/api/health");
    saveJSON("health.json", health);

    // 12. DSL files
    console.log("Fetching /api/dsl/files...");
    const dslFiles = await fetchJSON("/api/dsl/files");
    saveJSON("dsl/files.json", dslFiles);

    // Fetch individual DSL file contents
    if (dslFiles) {
      const flatPaths = flattenDslPaths(dslFiles);
      for (const fp of flatPaths) {
        const dslContent = await fetchJSON(`/api/dsl/files/${fp}`);
        if (dslContent) {
          saveJSON(`dsl/files/${fp}.json`, dslContent);
        }
      }
    }

    // 13. Graph traverse (sample)
    console.log("Fetching /api/graph/traverse samples...");
    for (const sysId of entityIds.filter(id => id.startsWith("system.")).slice(0, 3)) {
      const traverse = await fetchJSON(`/api/graph/traverse?from=${encodeURIComponent(sysId)}&depth=3&direction=both`);
      if (traverse) {
        saveJSON(`graph/traverse/${sysId}.json`, traverse);
      }
    }

    // ═══════════════════════════════════════════
    //  PRE-GENERATE POST ENDPOINT RESPONSES
    // ═══════════════════════════════════════════

    console.log("\nPre-generating POST endpoint responses...");

    // Compile
    const compileResult = await postJSON("/api/compile", { branch: "main" });
    saveJSON("compile.json", compileResult);
    // Re-fetch status and records after compile
    const newStatus = await fetchJSON("/api/compile/status");
    saveJSON("compile/status.json", newStatus);
    const newRecords = await fetchJSON("/api/compile/records");
    saveJSON("compile/records.json", newRecords);

    // Artifact generation for key entities
    for (const eamsId of entityIds.filter(id => id.startsWith("system.") || id.startsWith("container."))) {
      for (const template of ["system-overview", "integration-spec"]) {
        const artifact = await postJSON("/api/artifacts/generate", { entity_id: eamsId, template });
        if (artifact) {
          saveJSON(`artifacts/generate/${eamsId}/${template}.json`, artifact);
        }
      }
    }

    // Scenario analysis for key entities
    for (const eamsId of entityIds.filter(id => id.startsWith("system.")).slice(0, 5)) {
      for (const actionType of ["deprecate", "remove"]) {
        const scenario = await postJSON("/api/scenarios/analyze", {
          actions: [{ type: actionType, target_entity_id: eamsId }],
        });
        if (scenario) {
          saveJSON(`scenarios/analyze/${eamsId}/${actionType}.json`, scenario);
        }
      }
    }

    // ═══════════════════════════════════════════
    //  GENERATE _headers FILE
    // ═══════════════════════════════════════════

    const headersContent = `/api/*
  Content-Type: application/json
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
`;
    fs.writeFileSync(path.join(process.cwd(), "dist", "public", "_headers"), headersContent);

    // Count generated files
    let fileCount = 0;
    function countFiles(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
        else fileCount++;
      }
    }
    countFiles(OUTPUT_DIR);

    console.log(`\n✓ Generated ${fileCount} static API files in dist/public/api/`);
    console.log("✓ Created dist/public/_headers");

  } finally {
    server.kill("SIGTERM");
    console.log("\nServer stopped.");
  }
}

function flattenDslPaths(items) {
  const paths = [];
  for (const item of (items || [])) {
    if (item.type === "file" && item.path) {
      paths.push(item.path);
    }
    if (item.children) {
      paths.push(...flattenDslPaths(item.children));
    }
  }
  return paths;
}

main().catch(err => {
  console.error("Static API generation failed:", err);
  process.exit(1);
});
