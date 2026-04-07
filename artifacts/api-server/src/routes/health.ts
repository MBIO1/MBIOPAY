import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool, isDatabaseConfigured } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "not_configured";
  if (isDatabaseConfigured && pool) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbStatus = "ok";
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
  }
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, db: dbStatus, dbConfigured: isDatabaseConfigured, dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 40) + "..." : "not set" });
});

export default router;
