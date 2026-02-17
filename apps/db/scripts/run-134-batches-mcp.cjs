/**
 * Runs 134_seed_curriculum_content batches via Supabase MCP execute_sql.
 *
 * This script prepares each batch's SQL and writes the MCP execute_sql args
 * to a JSON file. You then run those via MCP (e.g. in Cursor with user-supabase):
 *   execute_sql(project_id, query)
 *
 * Usage:
 *   node apps/db/scripts/run-134-batches-mcp.cjs [--list-only] [--batches 1-10]
 *
 * Output: for each batch, logs the batch file and query length. To actually run
 * via MCP, invoke execute_sql(project_id, readFile(batch)) from your MCP client.
 *
 * Project ID: set SUPABASE_PROJECT_ID or use default hnlsqznoviwnyrkskfay.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || "hnlsqznoviwnyrkskfay";
const BATCH_DIR = path.join(__dirname, "..", "migrations", "134_batches");
const OUT_DIR = path.join(__dirname, "..", "migrations", "134_batches", "_mcp_args");

function loadBatch(f) {
  return fs.readFileSync(path.join(BATCH_DIR, f), "utf8");
}

function main() {
  const listOnly = process.argv.includes("--list-only");
  const batchesArg = process.argv.find((a) => a.startsWith("--batches="));
  const range = batchesArg ? batchesArg.slice("--batches=".length) : null;

  const all = fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".sql")).sort();
  let files = all;
  if (range) {
    const [a, b] = range.split("-").map(Number);
    files = all.filter((f) => {
      const n = parseInt(f.replace(/\D/g, ""), 10);
      return n >= a && n <= b;
    });
  }

  if (listOnly) {
    console.log(`Batch files (${files.length}):`);
    files.forEach((f) => console.log("  ", f));
    return;
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let err = 0;
  for (const f of files) {
    try {
      const query = loadBatch(f);
      const args = { project_id: PROJECT_ID, query };
      const outFile = path.join(OUT_DIR, f.replace(".sql", ".json"));
      fs.writeFileSync(outFile, JSON.stringify(args), "utf8");
      ok++;
      if (ok % 50 === 0) console.log(`  ${ok}/${files.length} ${f} (query ${query.length} chars)`);
    } catch (e) {
      err++;
      console.error(`  FAIL ${f}:`, e.message);
    }
  }
  console.log(`Wrote ${ok} _mcp_args JSON files to ${OUT_DIR}. Failed: ${err}`);
  if (err) process.exit(1);
}

main();
