/**
 * Splits 134_seed_curriculum_content.sql into smaller batch files
 * so each batch can be run via Supabase MCP execute_sql.
 *
 * Run: node apps/db/scripts/split-134-batches.cjs
 * Output: apps/db/migrations/134_batches/134_batch_001.sql, ...
 */

const fs = require("fs");
const path = require("path");

const MIGRATION_PATH = path.join(
  __dirname,
  "..",
  "migrations",
  "134_seed_curriculum_content.sql"
);
const OUT_DIR = path.join(__dirname, "..", "migrations", "134_batches");
const BATCH_SIZE = 5;

const content = fs.readFileSync(MIGRATION_PATH, "utf8");
const delimiter = "INSERT INTO curriculum_content ";
const parts = content.split(delimiter);

// parts[0] = header; parts[1..] = INSERT bodies
const bodies = parts.slice(1);
const inserts = bodies.map((b) => "INSERT INTO curriculum_content " + b.trim());

fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
  const batch = inserts.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const name = `134_batch_${String(batchNum).padStart(3, "0")}.sql`;
  fs.writeFileSync(path.join(OUT_DIR, name), batch.join("\n"), "utf8");
  written++;
}

console.log(`Wrote ${written} batch files (${inserts.length} INSERTs, ${BATCH_SIZE} per batch).`);
