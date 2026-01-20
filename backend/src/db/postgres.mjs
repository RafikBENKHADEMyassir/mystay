import pg from "pg";

import { loadEnv } from "../env.mjs";

loadEnv();

const { Pool, Client } = pg;

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mystay";

const pool = new Pool({ connectionString });

export function getConnectionString() {
  return connectionString;
}

export async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

export function createNotificationClient() {
  return new Client({ connectionString });
}

