import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
type Database = ReturnType<typeof drizzle>;

// Accept DATABASE_URL or individual PG* env vars (Render auto-injects PGHOST, PGUSER, etc.)
const connectionString = process.env.DATABASE_URL?.trim();
const hasPgEnv = Boolean(process.env.PGHOST);

export const isDatabaseConfigured = Boolean(connectionString || hasPgEnv);

const poolConfig = connectionString
  ? { connectionString, ssl: (connectionString.includes("render.com") && !connectionString.includes(".internal")) ? { rejectUnauthorized: false } : undefined }
  : hasPgEnv
  ? {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false },
    }
  : null;

export const pool = poolConfig
  ? new Pool({
      ...poolConfig,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    })
  : null;

pool?.on("error", (err) => {
  console.error("[db-pool] Unexpected idle client error:", err.message);
});

const actualDb = pool ? drizzle(pool, { schema }) : null;

function missingDatabaseError() {
  return new Error("DATABASE_URL or PG* env vars are not configured. Database-backed routes are unavailable.");
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    if (!actualDb) {
      throw missingDatabaseError();
    }

    const value = Reflect.get(actualDb as object, prop, receiver);
    return typeof value === "function" ? value.bind(actualDb) : value;
  },
}) as Database;

export function getDatabaseStatus() {
  return {
    configured: isDatabaseConfigured,
    connected: pool !== null,
  };
}

export * from "./schema";

