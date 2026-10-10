#!/usr/bin/env node

/**
 * =============================================================================
 * Marush Mobile Application — Database Migration Runner
 * =============================================================================
 * 
 * Commands:
 *   node scripts/migrate.js new <name>      Create a new numbered migration file
 *   node scripts/migrate.js up              Apply all pending migrations to database
 *   node scripts/migrate.js status          Check migration status against database
 *   node scripts/migrate.js check           Check if pending migrations exist (CI exit code)
 * 
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');
const ENV_FILE = path.join(ROOT_DIR, '.env');

// -----------------------------------------------------------------------------
// Environment Loading Helper
// -----------------------------------------------------------------------------
function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    null
  );
}

function parsePostgresUri(uri) {
  const prefixMatch = uri.match(/^postgres(?:ql)?:\/\//);
  if (!prefixMatch) return { connectionString: uri };

  const withoutPrefix = uri.substring(prefixMatch[0].length);
  const lastAt = withoutPrefix.lastIndexOf('@');
  if (lastAt === -1) return { connectionString: uri };

  const userInfo = withoutPrefix.substring(0, lastAt);
  const hostAndDb = withoutPrefix.substring(lastAt + 1);

  const colonIdx = userInfo.indexOf(':');
  const user = colonIdx !== -1 ? userInfo.substring(0, colonIdx) : userInfo;
  const password = colonIdx !== -1 ? userInfo.substring(colonIdx + 1) : '';

  const slashIdx = hostAndDb.indexOf('/');
  const hostAndPort = slashIdx !== -1 ? hostAndDb.substring(0, slashIdx) : hostAndDb;
  const database = slashIdx !== -1 ? hostAndDb.substring(slashIdx + 1).split('?')[0] : 'postgres';

  const [host, portStr] = hostAndPort.split(':');
  const port = portStr ? parseInt(portStr, 10) : 5432;

  return {
    user,
    password,
    host,
    port,
    database,
  };
}

function getDbClient() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL is not set in environment or .env file.');
    console.error('Please configure DATABASE_URL in your .env file:');
    console.error('  DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:6543/postgres\n');
    process.exit(1);
  }

  const parsed = parsePostgresUri(connectionString);

  return new Client({
    ...parsed,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex').substring(0, 16);
}

// -----------------------------------------------------------------------------
// Migration Table Initialization
// -----------------------------------------------------------------------------
async function initMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Detect if previous baseline tables already exist (e.g., initial schema was applied)
  const countRes = await client.query(`SELECT COUNT(*) FROM public._migrations;`);
  const migrationsCount = parseInt(countRes.rows[0].count, 10);

  if (migrationsCount === 0) {
    const checkTablesRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
      );
    `);

    // If tables exist but _migrations is empty, record current existing migrations as baseline
    if (checkTablesRes.rows[0].exists) {
      const files = getMigrationFiles();
      for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const checksum = calculateChecksum(content);
        await client.query(
          `INSERT INTO public._migrations (name, checksum, applied_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (name) DO NOTHING;`,
          [file, checksum]
        );
      }
      console.log(`ℹ️ Initialized migration tracker and baseline-marked ${files.length} existing migrations.`);
    }
  }
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

// -----------------------------------------------------------------------------
// Command: NEW / CREATE
// -----------------------------------------------------------------------------
function cmdCreate(nameArg) {
  if (!nameArg) {
    console.error('\n❌ Please provide a migration name.');
    console.error('Usage: node scripts/migrate.js new <name_of_migration>\n');
    console.error('Example: node scripts/migrate.js new add_vaccine_inventory\n');
    process.exit(1);
  }

  const sanitized = nameArg
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '');

  const files = getMigrationFiles();
  let nextNumber = 1;

  for (const f of files) {
    const match = f.match(/^(\d+)_/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextNumber) {
        nextNumber = num + 1;
      }
    }
  }

  const prefix = String(nextNumber).padStart(3, '0');
  const fileName = `${prefix}_${sanitized}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  const template = `-- =============================================================================
-- Migration ${prefix}: ${nameArg}
-- Created At: ${new Date().toISOString()}
-- =============================================================================

-- Write your PostgreSQL DDL/DML statements below:
-- Example:
-- ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS notes TEXT;

`;

  fs.writeFileSync(filePath, template, 'utf-8');
  console.log(`\n✅ Migration created successfully:`);
  console.log(`   Path: supabase/migrations/${fileName}`);
  console.log(`   Full: ${filePath}\n`);
}

// -----------------------------------------------------------------------------
// Command: UP / APPLY
// -----------------------------------------------------------------------------
async function cmdUp() {
  const client = getDbClient();
  try {
    await client.connect();
    await initMigrationsTable(client);

    const appliedRes = await client.query(`SELECT name, checksum FROM public._migrations ORDER BY id ASC;`);
    const appliedMap = new Map(appliedRes.rows.map((r) => [r.name, r.checksum]));

    const files = getMigrationFiles();
    const pending = files.filter((f) => !appliedMap.has(f));

    if (pending.length === 0) {
      console.log('\n✨ Database is up to date! No pending migrations to apply.\n');
      return;
    }

    console.log(`\n🚀 Applying ${pending.length} pending migration(s)...\n`);

    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const checksum = calculateChecksum(sql);

      process.stdout.write(`   Applying ${file} ... `);
      const startTime = Date.now();

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO public._migrations (name, checksum, applied_at) VALUES ($1, $2, NOW());`,
          [file, checksum]
        );
        await client.query('COMMIT');
        const duration = Date.now() - startTime;
        console.log(`✅ Done (${duration}ms)`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.log(`❌ FAILED!`);
        console.error(`\nError in migration ${file}:`, err.message);
        process.exit(1);
      }
    }

    console.log(`\n🎉 All ${pending.length} migration(s) applied successfully!\n`);
  } finally {
    await client.end();
  }
}

// -----------------------------------------------------------------------------
// Command: STATUS / CHECK
// -----------------------------------------------------------------------------
async function cmdStatus(exitOnPending = false) {
  const client = getDbClient();
  try {
    await client.connect();
    await initMigrationsTable(client);

    const appliedRes = await client.query(
      `SELECT name, checksum, applied_at FROM public._migrations ORDER BY id ASC;`
    );
    const appliedMap = new Map(appliedRes.rows.map((r) => [r.name, r]));

    const files = getMigrationFiles();

    console.log('\n================================================================================');
    console.log('              MARUSH SUPABASE DATABASE MIGRATIONS STATUS');
    console.log('================================================================================');
    console.log(
      `${'#'.padEnd(4)} ${'MIGRATION FILE'.padEnd(38)} ${'STATUS'.padEnd(12)} ${'APPLIED AT'.padEnd(20)}`
    );
    console.log('-'.repeat(80));

    let pendingCount = 0;
    let appliedCount = 0;

    files.forEach((file, idx) => {
      const applied = appliedMap.get(file);
      const numStr = String(idx + 1).padEnd(4);
      const nameStr = file.padEnd(38);

      if (applied) {
        appliedCount++;
        const dateStr = new Date(applied.applied_at).toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        console.log(`${numStr} ${nameStr} \x1b[32mAPPLIED\x1b[0m     ${dateStr}`);
      } else {
        pendingCount++;
        console.log(`${numStr} ${nameStr} \x1b[33mPENDING\x1b[0m     --`);
      }
    });

    console.log('-'.repeat(80));
    console.log(
      `Summary: Total: ${files.length} | Applied: \x1b[32m${appliedCount}\x1b[0m | Pending: \x1b[33m${pendingCount}\x1b[0m\n`
    );

    if (exitOnPending && pendingCount > 0) {
      console.error(`❌ Check failed: There are ${pendingCount} unapplied migration(s).`);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

// -----------------------------------------------------------------------------
// CLI Dispatcher
// -----------------------------------------------------------------------------
async function main() {
  const action = (process.argv[2] || '').toLowerCase();
  const arg = process.argv[3];

  switch (action) {
    case 'new':
    case 'create':
      cmdCreate(arg);
      break;

    case 'up':
    case 'apply':
      await cmdUp();
      break;

    case 'status':
      await cmdStatus(false);
      break;

    case 'check':
      await cmdStatus(true);
      break;

    default:
      console.log(`
================================================================================
Marush Database Migration Utility
================================================================================

Usage:
  node scripts/migrate.js new <name>      Create a new numbered migration file
  node scripts/migrate.js up              Apply pending migrations to Supabase
  node scripts/migrate.js status          Display current migration status
  node scripts/migrate.js check           Check for pending migrations (CI exit code)

NPM Shortcuts:
  pnpm migrate:new <name>
  pnpm migrate:up
  pnpm migrate:status
  pnpm migrate:check
`);
      break;
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal Migration Error:', err);
  process.exit(1);
});
