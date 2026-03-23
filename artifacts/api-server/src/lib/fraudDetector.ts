import { db } from "@workspace/db";
import {
  ordersTable,
  usersTable,
  fraudEventsTable,
  phoneBlocklistTable,
} from "@workspace/db/schema";
import { eq, and, gte, count, countDistinct, ne, sql } from "drizzle-orm";
import { logger } from "./logger";

// ─── Thresholds ────────────────────────────────────────────────────────────────
const PHONE_VELOCITY_WINDOW_H = 24;
const PHONE_VELOCITY_MAX = 5;          // max successful payouts to same phone in 24h
const CROSS_USER_WINDOW_H = 1;
const CROSS_USER_MAX = 3;              // max distinct users sending to same phone in 1h
const USER_DAILY_ORDER_MAX = 20;       // max orders per user per 24h
const HIGH_VALUE_THRESHOLD = 200;      // USDT — flag large orders
const AUTO_FREEZE_RISK_SCORE = 100;    // auto-freeze above this

// Risk points added per event type
const RISK_POINTS: Record<string, number> = {
  PHONE_VELOCITY:     30,
  CROSS_USER_PHONE:   40,
  USER_VELOCITY:      20,
  HIGH_VALUE_ORDER:   10,
  BLOCKED_PHONE:       0, // hard block, no score needed
  REPEATED_FAILURES:  25,
};

// ─── Log + score ───────────────────────────────────────────────────────────────
async function logFraudEvent(opts: {
  userId?: number;
  orderId?: number;
  phone?: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  details?: Record<string, unknown>;
}) {
  await db.insert(fraudEventsTable).values({
    userId:    opts.userId ?? null,
    orderId:   opts.orderId ?? null,
    phone:     opts.phone ?? null,
    eventType: opts.eventType,
    severity:  opts.severity,
    details:   opts.details ?? {},
  });
  logger.warn(opts, `[FRAUD] ${opts.eventType}`);
}

async function addRiskScore(userId: number, points: number, reason: string) {
  const [user] = await db
    .update(usersTable)
    .set({
      riskScore: sql`${usersTable.riskScore} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning({ riskScore: usersTable.riskScore, isFrozen: usersTable.isFrozen });

  if (user && user.riskScore >= AUTO_FREEZE_RISK_SCORE && !user.isFrozen) {
    await db.update(usersTable).set({
      isFrozen:     true,
      frozenAt:     new Date(),
      frozenReason: `Auto-frozen: risk score ${user.riskScore} — ${reason}`,
      updatedAt:    new Date(),
    }).where(eq(usersTable.id, userId));
    logger.warn({ userId, riskScore: user.riskScore }, "[FRAUD] User auto-frozen");
  }
}

// ─── Individual checks ─────────────────────────────────────────────────────────

/** Is this phone on the blocklist? */
export async function checkPhoneBlocklist(phone: string): Promise<{ blocked: boolean; reason: string }> {
  const [entry] = await db
    .select()
    .from(phoneBlocklistTable)
    .where(eq(phoneBlocklistTable.phone, phone))
    .limit(1);

  return entry
    ? { blocked: true, reason: entry.reason }
    : { blocked: false, reason: "" };
}

/** Is the user account frozen? */
export async function checkUserFrozen(userId: number): Promise<{ frozen: boolean; reason: string }> {
  const [user] = await db
    .select({ isFrozen: usersTable.isFrozen, frozenReason: usersTable.frozenReason })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user?.isFrozen
    ? { frozen: true, reason: user.frozenReason ?? "Account suspended" }
    : { frozen: false, reason: "" };
}

/** More than PHONE_VELOCITY_MAX successful payouts to the same phone in the last 24h */
async function checkPhoneVelocity(phone: string, userId: number, orderId?: number): Promise<boolean> {
  const since = new Date(Date.now() - PHONE_VELOCITY_WINDOW_H * 60 * 60 * 1000);
  const [row] = await db
    .select({ cnt: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.phone, phone),
        eq(ordersTable.status, "completed"),
        gte(ordersTable.createdAt, since),
      ),
    );

  const cnt = row?.cnt ?? 0;
  if (cnt >= PHONE_VELOCITY_MAX) {
    await logFraudEvent({
      userId,
      orderId,
      phone,
      eventType: "PHONE_VELOCITY",
      severity: "high",
      details: { payoutsLast24h: cnt, threshold: PHONE_VELOCITY_MAX },
    });
    await addRiskScore(userId, RISK_POINTS.PHONE_VELOCITY, "phone velocity exceeded");
    return true;
  }
  return false;
}

/** More than CROSS_USER_MAX distinct users sending to the same phone in the last 1h */
async function checkCrossUserPhone(phone: string, userId: number, orderId?: number): Promise<boolean> {
  const since = new Date(Date.now() - CROSS_USER_WINDOW_H * 60 * 60 * 1000);
  const [row] = await db
    .select({ cnt: countDistinct(ordersTable.userId) })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.phone, phone),
        ne(ordersTable.status, "expired"),
        ne(ordersTable.status, "failed"),
        gte(ordersTable.createdAt, since),
      ),
    );

  const cnt = row?.cnt ?? 0;
  if (cnt >= CROSS_USER_MAX) {
    await logFraudEvent({
      userId,
      orderId,
      phone,
      eventType: "CROSS_USER_PHONE",
      severity: "critical",
      details: { distinctUsersLastHour: cnt, threshold: CROSS_USER_MAX },
    });
    await addRiskScore(userId, RISK_POINTS.CROSS_USER_PHONE, "cross-user phone pattern");
    return true;
  }
  return false;
}

/** More than USER_DAILY_ORDER_MAX orders by this user in the last 24h */
async function checkUserVelocity(userId: number, orderId?: number): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ cnt: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), gte(ordersTable.createdAt, since)));

  const cnt = row?.cnt ?? 0;
  if (cnt >= USER_DAILY_ORDER_MAX) {
    await logFraudEvent({
      userId,
      orderId,
      eventType: "USER_VELOCITY",
      severity: "medium",
      details: { ordersLast24h: cnt, threshold: USER_DAILY_ORDER_MAX },
    });
    await addRiskScore(userId, RISK_POINTS.USER_VELOCITY, "user velocity exceeded");
    return true;
  }
  return false;
}

/** Order value exceeds the high-value threshold — flag but don't block */
async function checkHighValue(usdtAmount: number, userId: number, orderId?: number): Promise<void> {
  if (usdtAmount >= HIGH_VALUE_THRESHOLD) {
    await logFraudEvent({
      userId,
      orderId,
      eventType: "HIGH_VALUE_ORDER",
      severity: "medium",
      details: { amount: usdtAmount, threshold: HIGH_VALUE_THRESHOLD },
    });
    await addRiskScore(userId, RISK_POINTS.HIGH_VALUE_ORDER, "high value order");
  }
}

/** More than 3 failed orders by this user in the last 24h */
async function checkRepeatedFailures(userId: number, orderId?: number): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ cnt: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.userId, userId),
        eq(ordersTable.status, "failed"),
        gte(ordersTable.createdAt, since),
      ),
    );

  const cnt = row?.cnt ?? 0;
  if (cnt >= 3) {
    await logFraudEvent({
      userId,
      orderId,
      eventType: "REPEATED_FAILURES",
      severity: "medium",
      details: { failedOrdersLast24h: cnt },
    });
    await addRiskScore(userId, RISK_POINTS.REPEATED_FAILURES, "repeated failed orders");
    return true;
  }
  return false;
}

// ─── Main pre-order check ──────────────────────────────────────────────────────

export interface FraudCheckResult {
  allowed: boolean;
  reason: string;
  flagged: boolean;      // allowed but flagged for review
}

export async function runFraudChecks(opts: {
  userId: number;
  phone: string;
  usdtAmount: number;
  orderId?: number;
}): Promise<FraudCheckResult> {
  const { userId, phone, usdtAmount, orderId } = opts;

  // 1. Phone blocklist — hard block
  const blocklist = await checkPhoneBlocklist(phone);
  if (blocklist.blocked) {
    await logFraudEvent({
      userId,
      orderId,
      phone,
      eventType: "BLOCKED_PHONE",
      severity: "critical",
      details: { reason: blocklist.reason },
    });
    return { allowed: false, reason: `This phone number is blocked: ${blocklist.reason}`, flagged: false };
  }

  // 2. Frozen user — hard block
  const frozen = await checkUserFrozen(userId);
  if (frozen.frozen) {
    return { allowed: false, reason: `Your account has been suspended. ${frozen.reason}`, flagged: false };
  }

  // 3. Phone velocity — hard block (could be money mule)
  const phoneVelocity = await checkPhoneVelocity(phone, userId, orderId);
  if (phoneVelocity) {
    return { allowed: false, reason: "This phone number has received too many payouts recently. Please try again later.", flagged: false };
  }

  // 4. Cross-user phone — hard block (muling pattern)
  const crossUser = await checkCrossUserPhone(phone, userId, orderId);
  if (crossUser) {
    return { allowed: false, reason: "This phone number is being used by too many accounts. Contact support.", flagged: false };
  }

  // 5. User order velocity — hard block
  const userVelocity = await checkUserVelocity(userId, orderId);
  if (userVelocity) {
    return { allowed: false, reason: "Daily order limit reached. Please try again tomorrow.", flagged: false };
  }

  // 6. Repeated failures — flag (warn but allow)
  const repeated = await checkRepeatedFailures(userId, orderId);

  // 7. High value — flag (allow but log)
  await checkHighValue(usdtAmount, userId, orderId);

  const flagged = repeated;
  return { allowed: true, reason: "", flagged };
}
