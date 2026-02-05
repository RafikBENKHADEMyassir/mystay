import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { loadEnv } from "../src/env.mjs";

loadEnv();

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptsDir, "..");

const seedPath = path.join(backendDir, "db", "seed.sql");
const migrationsFolder = path.join(backendDir, "db", "migrations");

const command = process.argv[2] ?? "help";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mystay";

const migrationsTable = process.env.DRIZZLE_MIGRATIONS_TABLE ?? "__drizzle_migrations";
const migrationsSchema = process.env.DRIZZLE_MIGRATIONS_SCHEMA ?? "public";

const { Pool } = pg;

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function migrateDb() {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      `missing_migrations_folder:${migrationsFolder} (run \`npm run db:generate\` once, then commit migrations)`
    );
  }
  await migrate(db, { migrationsFolder, migrationsTable, migrationsSchema });
  console.log(`migrated: ${databaseUrl}`);
}

async function seedDb() {
  if (!fs.existsSync(seedPath)) throw new Error(`missing_sql_file:${seedPath}`);
  const seedSql = fs.readFileSync(seedPath, "utf8");

  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(seedSql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  console.log(`seeded: ${databaseUrl}`);
}

async function resetDb() {
  await withClient(async (client) => {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
  });
  await migrateDb();
  await seedDb();
}

function help() {
  console.log(
    [
      "Usage:",
      "  node backend/scripts/db.mjs migrate   # apply Drizzle migrations",
      "  node backend/scripts/db.mjs seed      # apply seed.sql",
      "  node backend/scripts/db.mjs reset     # drop schema + migrate + seed",
      "",
      "Env:",
      "  DATABASE_URL=... (default: postgresql://postgres:postgres@localhost:5432/mystay)"
    ].join("\n")
  );
}

try {
  if (command === "migrate") await migrateDb();
  else if (command === "seed") await seedDb();
  else if (command === "reset") await resetDb();
  else help();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    const cause = error.cause;
    if (cause instanceof Error) {
      console.error(cause.message);
    } else if (cause !== undefined) {
      console.error(cause);
    }
    if (error.stack) console.error(error.stack);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
