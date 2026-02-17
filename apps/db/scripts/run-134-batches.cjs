/**
 * Runs all 134_seed_curriculum_content batch files against the Supabase DB.
 * Use after: split-134-batches.cjs and TRUNCATE curriculum_content (via MCP or SQL).
 *
 * Requires: DATABASE_URL (Supabase Postgres URI from Dashboard → Settings → Database)
 *           npm install pg  (or already in the project)
 *
 * Run from repo root: node apps/db/scripts/run-134-batches.cjs
 * Or from apps/web:   node ../db/scripts/run-134-batches.cjs
 * Loads DATABASE_URL from apps/web/.env.local or .env when not set in env.
 */

const fs = require("fs");
const path = require("path");

// Resolve pg: prefer apps/web/node_modules when run from repo root (pg is in apps/web devDependencies)
const webNode = path.join(__dirname, "..", "..", "web", "node_modules");
if (fs.existsSync(webNode)) {
  module.paths.unshift(webNode);
}
let Client;
try {
  Client = require("pg").Client;
} catch {
  throw new Error("Cannot find module 'pg'. Run: cd apps/web && npm install");
}

const BATCH_DIR = path.join(__dirname, "..", "migrations", "134_batches");

// Load DATABASE_URL from env files when not in process.env
function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const roots = [
    path.join(__dirname, "..", "..", "web"), // apps/web
    process.cwd(),
  ];
  for (const root of roots) {
    for (const name of [".env.local", ".env"]) {
      const p = path.join(root, name);
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (m && m[1] === "DATABASE_URL") {
          process.env.DATABASE_URL = m[2].trim().replace(/^["']|["']$/g, "");
          return;
        }
      }
    }
  }
}

loadDatabaseUrl();

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error("Set DATABASE_URL (Supabase Postgres URI, or add to apps/web/.env.local).");
    process.exit(1);
  }

  let client;
  try {
    client = new Client({ connectionString: conn });
    await client.connect();
  } catch (e) {
    console.error("DB connect failed:", e.message);
    process.exit(1);
  }

  const files = fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".sql")).sort();
  let ok = 0, err = 0;
  for (const f of files) {
    try {
      const sql = fs.readFileSync(path.join(BATCH_DIR, f), "utf8");
      await client.query(sql);
      ok++;
      if (ok % 50 === 0) console.log(`  ${ok}/${files.length} ${f}`);
    } catch (e) {
      err++;
      console.error(`  FAIL ${f}:`, e.message);
    }
  }
  await client.end();
  console.log(`Done. OK: ${ok}, Failed: ${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main();
