import { loadEnv } from "./src/env.mjs";
import type { Config } from "drizzle-kit";

loadEnv();

export default {
  schema: "./src/db/drizzle/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mystay"
  },
  strict: true,
  verbose: true
} satisfies Config;
