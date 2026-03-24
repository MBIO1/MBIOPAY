import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { desc, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/activity", async (_req, res) => {
  try {
    const rows = await db
      .select({
        phone: ordersTable.phone,
        network: ordersTable.network,
        amount: ordersTable.amount,
        status: ordersTable.status,
      })
      .from(ordersTable)
      .where(inArray(ordersTable.status, ["processing", "completed"]))
      .orderBy(desc(ordersTable.id))
      .limit(10);

    const sanitized = rows.map((r) => {
      const phone = r.phone ?? "";
      const masked =
        phone.length >= 5
          ? phone.slice(0, 3) + "****" + phone.slice(-2)
          : "User";
      return {
        user: masked,
        network: r.network ?? "MTN",
        amount: Math.round(Number(r.amount) || 0),
        time: "just now",
      };
    });

    res.json(sanitized);
  } catch {
    res.json([]);
  }
});

export default router;
