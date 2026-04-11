import { createHash, randomInt } from "crypto";
import { db } from "@workspace/db";
import { otpCodesTable } from "@workspace/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { sendVerificationEmail } from "./emailService";

const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_PER_MINUTE = 3;
const COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const IP_BLOCK_MS = 15 * 60 * 1000;
const IP_FAIL_THRESHOLD = 10;

// ─── In-Memory IP Block Table ─────────────────────────────────────────────────
const ipFailures = new Map<string, number>();
const ipBlockedUntil = new Map<string, number>();

export function isIPBlocked(ip: string): boolean {
  const until = ipBlockedUntil.get(ip);
  if (!until) return false;
  if (Date.now() > until) {
    ipBlockedUntil.delete(ip);
    ipFailures.delete(ip);
    return false;
  }
  return true;
}

function recordIPFailure(ip: string): void {
  const count = (ipFailures.get(ip) ?? 0) + 1;
  ipFailures.set(ip, count);
  if (count >= IP_FAIL_THRESHOLD) {
    ipBlockedUntil.set(ip, Date.now() + IP_BLOCK_MS);
    ipFailures.delete(ip);
  }
}

function clearIPFailures(ip: string): void {
  ipFailures.delete(ip);
  ipBlockedUntil.delete(ip);
}

// ─── Hash OTP ─────────────────────────────────────────────────────────────────
function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
function generateOTP(): string {
  return String(randomInt(100000, 999999));
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export async function sendOTP(email: string, ip: string): Promise<void> {
  const now = Date.now();

  // Rate limit: max MAX_PER_MINUTE sends per email per 60s window
  const recentRecords = await db
    .select({ id: otpCodesTable.id })
    .from(otpCodesTable)
    .where(and(
      eq(otpCodesTable.email, email),
      gt(otpCodesTable.createdAt, now - 60_000),
    ));

  if (recentRecords.length >= MAX_PER_MINUTE) {
    throw Object.assign(new Error("Too many code requests. Please wait a minute before trying again."), { status: 429 });
  }

  // Cooldown: must wait 60s since last send
  const [last] = await db
    .select({ createdAt: otpCodesTable.createdAt })
    .from(otpCodesTable)
    .where(eq(otpCodesTable.email, email))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (last && now - last.createdAt < COOLDOWN_MS) {
    throw Object.assign(new Error("Please wait before requesting another code."), { status: 429 });
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await db.insert(otpCodesTable).values({
    email,
    otpHash,
    expiresAt: now + OTP_TTL_MS,
    ip,
    createdAt: now,
  });

  try {
    await sendVerificationEmail(email, otp);
    console.log(`[OTP] Verification code sent to ${email}`);
  } catch (error: any) {
    console.error(`[OTP] Failed to send email to ${email}:`, error.message);
    // Still throw the error so the API returns an error to the user
    throw Object.assign(new Error("Failed to send verification email. Please try again later."), { status: 500 });
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOTP(email: string, otp: string, ip: string): Promise<void> {
  if (isIPBlocked(ip)) {
    throw Object.assign(new Error("Too many failed attempts. Please try again later."), { status: 429 });
  }

  const now = Date.now();

  const [record] = await db
    .select()
    .from(otpCodesTable)
    .where(eq(otpCodesTable.email, email))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (!record) {
    throw Object.assign(new Error("No verification code found. Please request a new one."), { status: 400 });
  }

  if (record.used) {
    throw Object.assign(new Error("This code has already been used. Please request a new one."), { status: 400 });
  }

  if (record.expiresAt < now) {
    throw Object.assign(new Error("Verification code has expired. Please request a new one."), { status: 400 });
  }

  if (record.attempts >= record.maxAttempts) {
    throw Object.assign(new Error("Too many incorrect attempts. Please request a new code."), { status: 429 });
  }

  const hashedInput = hashOTP(otp.trim());

  if (hashedInput !== record.otpHash) {
    await db
      .update(otpCodesTable)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodesTable.id, record.id));

    recordIPFailure(ip);

    const remaining = record.maxAttempts - (record.attempts + 1);
    if (remaining > 0) {
      throw Object.assign(new Error(`Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`), { status: 422 });
    } else {
      throw Object.assign(new Error("Too many incorrect attempts. Please request a new code."), { status: 429 });
    }
  }

  // Success — mark as used and clear IP failures
  await db
    .update(otpCodesTable)
    .set({ used: true })
    .where(eq(otpCodesTable.id, record.id));

  clearIPFailures(ip);
}
