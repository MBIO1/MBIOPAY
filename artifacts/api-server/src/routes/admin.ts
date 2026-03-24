import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  ordersTable,
  fraudEventsTable,
  phoneBlocklistTable,
} from "@workspace/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import { getFlutterwaveUgxBalance } from "../lib/walletWatcher";
import { getHotWalletStats } from "../lib/dynamicRate";
import { requireAdmin } from "./adminAuth";

const router = Router();

// ─── Overview ─────────────────────────────────────────────────────────────────
router.get("/admin/overview", requireAdmin, async (_req, res) => {
  const [
    [totalUsersRow],
    [activeUsersRow],
    [frozenUsersRow],
    [totalOrdersRow],
    [completedOrdersRow],
    [pendingOrdersRow],
    [failedOrdersRow],
    [revenueRow],
    [fraudRow],
    [blockedRow],
  ] = await Promise.all([
    db.select({ cnt: count() }).from(usersTable),
    db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.emailVerified, true)),
    db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.isFrozen, true)),
    db.select({ cnt: count() }).from(ordersTable),
    db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "completed")),
    db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "waiting")),
    db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "failed")),
    db.select({ total: sum(ordersTable.amount) }).from(ordersTable).where(eq(ordersTable.status, "completed")),
    db.select({ cnt: count() }).from(fraudEventsTable),
    db.select({ cnt: count() }).from(phoneBlocklistTable),
  ]);

  const [hotStats, flwBalance] = await Promise.allSettled([
    getHotWalletStats(),
    getFlutterwaveUgxBalance(),
  ]);

  res.json({
    totalUsers: totalUsersRow?.cnt ?? 0,
    activeUsers: activeUsersRow?.cnt ?? 0,
    frozenUsers: frozenUsersRow?.cnt ?? 0,
    totalOrders: totalOrdersRow?.cnt ?? 0,
    completedOrders: completedOrdersRow?.cnt ?? 0,
    pendingOrders: pendingOrdersRow?.cnt ?? 0,
    failedOrders: failedOrdersRow?.cnt ?? 0,
    totalRevenue: parseFloat((revenueRow?.total ?? 0).toString()),
    hotBalance: hotStats.status === "fulfilled" ? hotStats.value.hotBalance : 0,
    hotIsLow: hotStats.status === "fulfilled" ? hotStats.value.isLow : false,
    flwBalance: flwBalance.status === "fulfilled" ? (flwBalance.value ?? 0) : 0,
    fraudFlags: fraudRow?.cnt ?? 0,
    blockedPhones: blockedRow?.cnt ?? 0,
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      uid: usersTable.uid,
      email: usersTable.email,
      username: usersTable.username,
      emailVerified: usersTable.emailVerified,
      totpEnabled: usersTable.totpEnabled,
      riskScore: usersTable.riskScore,
      isFrozen: usersTable.isFrozen,
      frozenReason: usersTable.frozenReason,
      frozenAt: usersTable.frozenAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.riskScore))
    .limit(200);
  res.json(users);
});

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get("/admin/orders", requireAdmin, async (_req, res) => {
  const orders = await db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      phone: ordersTable.phone,
      network: ordersTable.network,
      amount: ordersTable.amount,
      ugxAmount: ordersTable.ugxAmount,
      status: ordersTable.status,
      txid: ordersTable.txid,
      depositAddress: ordersTable.depositAddress,
      expiresAt: ordersTable.expiresAt,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(500);
  res.json(orders);
});

// ─── Fraud events ─────────────────────────────────────────────────────────────
router.get("/admin/fraud-events", requireAdmin, async (_req, res) => {
  const events = await db
    .select()
    .from(fraudEventsTable)
    .orderBy(desc(fraudEventsTable.createdAt))
    .limit(200);
  res.json(events);
});

// ─── Blocklist ────────────────────────────────────────────────────────────────
router.get("/admin/blocklist", requireAdmin, async (_req, res) => {
  const list = await db
    .select()
    .from(phoneBlocklistTable)
    .orderBy(desc(phoneBlocklistTable.createdAt));
  res.json(list);
});

router.post("/admin/block-phone", requireAdmin, async (req, res) => {
  const { phone, reason } = req.body as { phone: string; reason?: string };
  if (!phone) { res.status(400).json({ error: "phone is required" }); return; }
  await db
    .insert(phoneBlocklistTable)
    .values({ phone, reason: reason ?? "Manual admin block", blockedBy: "admin" })
    .onConflictDoUpdate({ target: phoneBlocklistTable.phone, set: { reason: reason ?? "Manual admin block" } });
  res.json({ success: true });
});

router.delete("/admin/block-phone/:phone", requireAdmin, async (req, res) => {
  await db.delete(phoneBlocklistTable).where(eq(phoneBlocklistTable.phone, req.params.phone));
  res.json({ success: true });
});

// ─── Freeze / Unfreeze ────────────────────────────────────────────────────────
router.post("/admin/freeze/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body as { reason?: string };
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(usersTable).set({
    isFrozen: true, frozenAt: new Date(),
    frozenReason: reason ?? "Admin freeze", updatedAt: new Date(),
  }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.post("/admin/unfreeze/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(usersTable).set({
    isFrozen: false, frozenAt: null, frozenReason: null, updatedAt: new Date(),
  }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.post("/admin/reset-risk/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(usersTable).set({ riskScore: 0, updatedAt: new Date() }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
