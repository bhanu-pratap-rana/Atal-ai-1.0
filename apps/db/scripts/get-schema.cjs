/**
 * Query database schema information
 */
const { Client } = require('pg');
const path = require('path');

async function main() {
  // Get fresh password from supabase CLI
  const { execSync } = require('child_process');
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const output = execSync('npx supabase db dump --linked --dry-run 2>&1', {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 60000
  });
  const pwMatch = output.match(/PGPASSWORD="([^"]+)"/);
  if (!pwMatch) {
    console.error('Could not get password from output:', output.substring(0, 500));
    process.exit(1);
  }

  const client = new Client({
    host: 'db.hnlsqznoviwnyrkskfay.supabase.co',
    port: 5432,
    user: 'cli_login_postgres',
    password: pwMatch[1],
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Get all tables from pg_tables (works better with limited permissions)
  const tables = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  console.log('=== TABLES (' + tables.rows.length + ') ===');
  tables.rows.forEach(r => console.log('- ' + r.tablename));

  // Get columns for each table
  console.log('\n=== TABLE COLUMNS ===');
  for (const t of tables.rows) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [t.tablename]);

    if (cols.rows.length > 0) {
      console.log('\n' + t.tablename + ':');
      cols.rows.forEach(c => {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = c.column_default ? ` DEFAULT ${c.column_default.substring(0, 30)}` : '';
        console.log('  - ' + c.column_name + ' (' + c.data_type + ', ' + nullable + ')' + def);
      });
    }
  }
  
  // Get all functions
  const functions = await client.query(`
    SELECT routine_name, routine_type
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    ORDER BY routine_name
  `);
  
  console.log('\n=== FUNCTIONS (' + functions.rows.length + ') ===');
  functions.rows.forEach(r => console.log('- ' + r.routine_name));
  
  // Get RLS policies
  const policies = await client.query(`
    SELECT tablename, policyname, cmd, permissive
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);
  
  console.log('\n=== RLS POLICIES (' + policies.rows.length + ') ===');
  let currentTable = '';
  policies.rows.forEach(r => {
    if (r.tablename !== currentTable) {
      currentTable = r.tablename;
      console.log('\n' + r.tablename + ':');
    }
    console.log('  - ' + r.policyname + ' (' + r.cmd + ', ' + (r.permissive === 'PERMISSIVE' ? 'permissive' : 'restrictive') + ')');
  });

  await client.end();
}

main().catch(console.error);
