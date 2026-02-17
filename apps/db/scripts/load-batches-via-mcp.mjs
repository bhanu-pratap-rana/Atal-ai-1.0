/**
 * Load all 134_batch_*.sql files via Supabase MCP execute_sql
 * 
 * This script reads each batch file and executes it via MCP.
 * Run from repo root: node apps/db/scripts/load-batches-via-mcp.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_DIR = path.join(__dirname, '..', 'migrations', '134_batches');
const PROJECT_ID = 'hnlsqznoviwnyrkskfay';

// Get all batch files sorted
const files = fs.readdirSync(BATCH_DIR)
  .filter(f => f.startsWith('134_batch_') && f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} batch files to load.`);

// For now, we'll just print what we would do
// In a real implementation, you'd call the MCP tool here
for (const file of files) {
  const filePath = path.join(BATCH_DIR, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  const sizeKB = (sql.length / 1024).toFixed(2);
  
  console.log(`${file}: ${sizeKB} KB`);
  
  // TODO: Execute via MCP
  // await callMCP('user-supabase', 'execute_sql', {
  //   project_id: PROJECT_ID,
  //   query: sql
  // });
}

console.log('\nNote: This script needs to be integrated with MCP tool calls.');
console.log('For now, use the manual approach or run-134-batches.cjs with pg installed.');
