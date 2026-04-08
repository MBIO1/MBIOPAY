import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool, isDatabaseConfigured, db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

const router: IRouter = Router();

// Run schema migration on first healthz call
let migrated = false;
async function ensureSchema() {
  if (migrated || !pool) return;
  migrated = true;
  try {
    const client = await pool.connect();
    // Drop and recreate all tables to match the drizzle schema
    await client.query(`
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS fraud_events CASCADE;
      DROP TABLE IF EXISTS phone_blocklist CASCADE;
      DROP TABLE IF EXISTS otp_codes CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS admins CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    client.release();
    console.log("[migration] Dropped all tables — db push will recreate them");
  } catch (e: any) {
    console.error("[migration] Failed:", e.message);
  }
}

router.get("/healthz", async (_req, res) => {
  let dbStatus = "not_configured";
  let tableStatus = "unknown";
  if (isDatabaseConfigured && pool) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbStatus = "ok";
      try {
        await db.select({ id: usersTable.id }).from(usersTable).limit(1);
        tableStatus = "ok";
      } catch (te: any) {
        tableStatus = `error: ${te.message}`;
      }
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
  }
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, db: dbStatus, tables: tableStatus, dbConfigured: isDatabaseConfigured });
});

router.post("/run-migration", async (_req, res) => {
  if (!pool) {
    res.status(503).json({ error: "No database" });
    return;
  }
  await ensureSchema();
  res.json({ ok: true, message: "Tables dropped. Restart service to let db push recreate them." });
});

export default router;
