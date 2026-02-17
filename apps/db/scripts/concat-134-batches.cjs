/**
 * Concatenates 134_batch_*.sql files into bigger chunks for running in
 * Supabase SQL Editor or via psql. Use when run-134-batches.cjs cannot run
 * (e.g. no DATABASE_URL or pg install fails).
 *
 * Output: apps/db/migrations/134_batches/concat_001-050.sql, concat_051-100.sql, ...
 * Each file has 50 batches (~2.5MB). Run in Supabase Dashboard → SQL Editor.
 *
 * Run: node apps/db/scripts/concat-134-batches.cjs
 */

const fs = require("fs");
const path = require("path");

const BATCH_DIR = path.join(__dirname, "..", "migrations", "134_batches");
const BATCHES_PER_CHUNK = 50;

const files = fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".sql")).sort();
const total = files.length;

let chunkIndex = 0;
let batchInChunk = 0;
let out = null;
let outPath = null;

function nextChunk() {
  if (out) {
    fs.writeFileSync(outPath, out, "utf8");
    console.log(`  Wrote ${outPath}`);
  }
  const start = chunkIndex * BATCHES_PER_CHUNK + 1;
  const end = Math.min((chunkIndex + 1) * BATCHES_PER_CHUNK, total);
  outPath = path.join(BATCH_DIR, `concat_${String(start).padStart(3, "0")}-${String(end).padStart(3, "0")}.sql`);
  out = "-- Chunk: batches " + start + " to " + end + "\n\n";
  batchInChunk = 0;
  chunkIndex++;
}

for (const f of files) {
  if (batchInChunk === 0) nextChunk();
  const sql = fs.readFileSync(path.join(BATCH_DIR, f), "utf8");
  out += sql;
  if (!out.endsWith("\n")) out += "\n";
  batchInChunk++;
  if (batchInChunk >= BATCHES_PER_CHUNK) batchInChunk = 0;
}

if (out) {
  fs.writeFileSync(outPath, out, "utf8");
  console.log(`  Wrote ${outPath}`);
}

console.log(`Done. ${total} batches → ${chunkIndex} concat files. Run each in Supabase SQL Editor.`);
