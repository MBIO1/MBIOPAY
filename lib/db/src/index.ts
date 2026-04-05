import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
type Database = ReturnType<typeof drizzle>;

const connectionString = process.env.DATABASE_URL?.trim();

export const isDatabaseConfigured = Boolean(connectionString);

export const pool = connectionString
  ? new Pool({
      connectionString,
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
  return new Error("DATABASE_URL is not configured. Database-backed routes are unavailable.");
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
