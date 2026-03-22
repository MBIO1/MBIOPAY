import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const CreateOrderSchema = z.object({
  phone: z.string().min(5, "Phone number is required"),
  network: z.enum(["MTN", "Airtel"]),
});

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { phone, network } = parsed.data;

  const [order] = await db
    .insert(ordersTable)
    .values({ phone, network, status: "waiting" })
    .returning();

  res.status(201).json({
    orderId: order.id,
    address: process.env.WALLET_ADDRESS,
    message: `Send USDT (TRC-20) to the address above. Your UGX payout will be sent to ${phone} on ${network} once the transaction is confirmed.`,
  });
});

router.get("/orders/recent", async (_req, res) => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(20);

  res.json(orders);
});

router.get("/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
});

router.get("/wallet/address", (_req, res) => {
  res.json({
    address: process.env.WALLET_ADDRESS ?? "",
    network: "TRC-20 (TRON)",
  });
});

export default router;
