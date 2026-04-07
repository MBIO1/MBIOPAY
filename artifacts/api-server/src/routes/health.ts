import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool, isDatabaseConfigured, db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "not_configured";
  let tableStatus = "unknown";
  if (isDatabaseConfigured && pool) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbStatus = "ok";
      // Test users table access
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

export default router;
