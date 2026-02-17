/**
 * Apply pending migrations to remote Supabase database
 * Usage: node scripts/apply-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from apps/web
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnlsqznoviwnyrkskfay.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const _MIGRATIONS = [
  '133_create_generated_lessons_cache.sql',
  '138_create_curriculum_metadata.sql'
];

async function _applyMigration(filename) {
  console.log(`\n--- Applying ${filename} ---`);

  const filepath = join(__dirname, '..', '..', 'db', 'migrations', filename);
  const sql = readFileSync(filepath, 'utf8');

  // Log file size
  console.log(`SQL file size: ${sql.length} bytes`);
  console.log(`First 200 chars: ${sql.substring(0, 200)}...`);

  // The SQL needs to be applied via Supabase Dashboard
  console.log('\n--- MANUAL STEPS REQUIRED ---');
  console.log('Please apply this migration via Supabase Dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/hnlsqznoviwnyrkskfay/sql');
  console.log(`2. Copy the contents from: ${filepath}`);
  console.log('3. Paste and run in the SQL Editor');

  return false;
}

async function main() {
  console.log('Applying pending migrations to remote database...');
  console.log('URL:', SUPABASE_URL);

  // Check if tables exist first
  const { data: _tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.log('Cannot query information_schema directly. Checking specific tables...');
  }

  // Try to query each missing table to see if it exists
  console.log('\nChecking for missing tables...');

  const missingTables = [];

  // Check generated_lessons
  const { error: genError } = await supabase.from('generated_lessons').select('id').limit(1);
  if (genError) {
    if (genError.code === '42P01' || genError.message?.includes('does not exist')) {
      missingTables.push('generated_lessons');
      console.log('- generated_lessons: MISSING');
    } else {
      console.log(`- generated_lessons: ERROR - ${genError.code}: ${genError.message}`);
      missingTables.push('generated_lessons');
    }
  } else {
    console.log('- generated_lessons: EXISTS');
  }

  // Check modules
  const { error: modError } = await supabase.from('modules').select('id').limit(1);
  if (modError) {
    if (modError.code === '42P01' || modError.message?.includes('does not exist')) {
      missingTables.push('modules');
      console.log('- modules: MISSING');
    } else {
      console.log(`- modules: ERROR - ${modError.code}: ${modError.message}`);
      missingTables.push('modules');
    }
  } else {
    console.log('- modules: EXISTS');
  }

  // Check topics
  const { error: topError } = await supabase.from('topics').select('id').limit(1);
  if (topError) {
    if (topError.code === '42P01' || topError.message?.includes('does not exist')) {
      missingTables.push('topics');
      console.log('- topics: MISSING');
    } else {
      console.log(`- topics: ERROR - ${topError.code}: ${topError.message}`);
      missingTables.push('topics');
    }
  } else {
    console.log('- topics: EXISTS');
  }

  if (missingTables.length === 0) {
    console.log('\n✓ All tables exist! No migrations needed.');
    return;
  }

  console.log(`\n${missingTables.length} tables are missing. Migration SQL files:`);

  if (missingTables.includes('generated_lessons')) {
    console.log(`\n1. generated_lessons: apps/db/migrations/133_create_generated_lessons_cache.sql`);
  }

  if (missingTables.includes('modules') || missingTables.includes('topics')) {
    console.log(`\n2. modules & topics: apps/db/migrations/138_create_curriculum_metadata.sql`);
  }

  console.log('\n--- INSTRUCTIONS ---');
  console.log('Please apply these migrations via Supabase Dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/hnlsqznoviwnyrkskfay/sql');
  console.log('2. Copy the SQL from the migration files listed above');
  console.log('3. Paste and run in the SQL Editor');
  console.log('4. After applying, run: npx supabase gen types typescript --linked > apps/web/src/types/database.ts');
}

main().catch(console.error);
