/**
 * Runs all 134_seed_curriculum_content batch files via Supabase REST API.
 * Uses service role key to bypass RLS.
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://hnlsqznoviwnyrkskfay.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubHNxem5vdml3bnlya3NrZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUwMTM3NiwiZXhwIjoyMDc4MDc3Mzc2fQ.cm9trOy1x_oxoBzAz57vYyOV4VsfGlTPlZsoqvmaxXg";

const BATCH_DIR = path.join(__dirname, "..", "migrations", "134_batches");

// Parse SQL INSERT statement to extract values
function parseInsert(sql) {
  // Match: VALUES ('M1', 'T1.1', 'en', 'curriculum', 'title', 'content', '[...]'::vector(768));
  const match = sql.match(/VALUES\s*\(\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'((?:[^'\\]|\\.|'')*)',\s*'((?:[^'\\]|\\.|'')*)',\s*'\[([\d\.,\-e]+)\]'::vector\(768\)\)/s);
  
  if (!match) return null;
  
  return {
    module_id: match[1],
    topic_id: match[2],
    language: match[3],
    content_type: match[4],
    title: match[5].replace(/''/g, "'"),
    content: match[6].replace(/''/g, "'"),
    embedding: match[7].split(',').map(Number)
  };
}

// Insert a batch of rows via REST API
async function insertBatch(rows) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/curriculum_content`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(rows)
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
}

async function main() {
  // Get all batch files
  const files = fs.readdirSync(BATCH_DIR)
    .filter(f => f.startsWith("134_batch_") && f.endsWith(".sql"))
    .sort();
  
  console.log(`Found ${files.length} batch files`);
  
  let totalInserted = 0;
  let errors = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(path.join(BATCH_DIR, file), "utf8");
    
    // Split by INSERT statements
    const inserts = content.split(/(?=INSERT INTO curriculum_content)/);
    const rows = [];
    
    for (const insert of inserts) {
      if (!insert.trim().startsWith("INSERT")) continue;
      const parsed = parseInsert(insert);
      if (parsed) {
        rows.push(parsed);
      }
    }
    
    if (rows.length === 0) {
      console.log(`  SKIP ${file} - no valid inserts`);
      continue;
    }
    
    try {
      await insertBatch(rows);
      totalInserted += rows.length;
      if ((i + 1) % 50 === 0 || i === files.length - 1) {
        console.log(`  ${i + 1}/${files.length} files, ${totalInserted} rows inserted`);
      }
    } catch (e) {
      errors++;
      console.error(`  FAIL ${file}: ${e.message}`);
    }
  }
  
  console.log(`\nDone. Inserted: ${totalInserted}, Errors: ${errors}`);
}

main().catch(console.error);
