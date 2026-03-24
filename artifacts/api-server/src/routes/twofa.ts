import { Router } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { sendTwoFADisabledEmail } from "../lib/emailService";

const router = Router();

// ─── GET /api/auth/2fa/setup ──────────────────────────────────────────────────
// Generate a TOTP secret + QR code for the authenticated user
router.get("/auth/2fa/setup", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (user.totpEnabled) {
    res.status(400).json({ error: "2FA is already enabled on this account" });
    return;
  }

  const secret = speakeasy.generateSecret({
    length: 20,
    name: `MBIO PAY (${user.email})`,
    issuer: "MBIO PAY",
  });

  await db.update(usersTable)
    .set({ totpSecret: secret.base32, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const qr = await QRCode.toDataURL(secret.otpauth_url!);

  res.json({
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qr,
  });
});

// ─── POST /api/auth/2fa/enable ────────────────────────────────────────────────
// Confirm TOTP setup with a valid code and enable 2FA
router.post("/auth/2fa/enable", requireAuth, async (req, res) => {
  const { token } = req.body as { token: string };

  if (!token) {
    res.status(400).json({ error: "Authenticator code is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (user.totpEnabled) {
    res.status(400).json({ error: "2FA is already enabled" });
    return;
  }

  if (!user.totpSecret) {
    res.status(400).json({ error: "No 2FA setup in progress. Please start setup first." });
    return;
  }

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    res.status(422).json({ error: "Invalid code. Make sure your authenticator app is set up correctly and try again." });
    return;
  }

  await db.update(usersTable)
    .set({ totpEnabled: true, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true, message: "Two-factor authentication has been enabled." });
});

// ─── POST /api/auth/2fa/disable ───────────────────────────────────────────────
// Disable 2FA — requires password + active TOTP code
router.post("/auth/2fa/disable", requireAuth, async (req, res) => {
  const { password, token } = req.body as { password: string; token: string };

  if (!password || !token) {
    res.status(400).json({ error: "Password and authenticator code are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (!user.totpEnabled) {
    res.status(400).json({ error: "2FA is not enabled on this account" });
    return;
  }

  const passOk = await bcrypt.compare(password, user.passwordHash);
  if (!passOk) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret!,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    res.status(422).json({ error: "Invalid authenticator code" });
    return;
  }

  await db.update(usersTable)
    .set({ totpEnabled: false, totpSecret: null, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, user.id));

  await sendTwoFADisabledEmail(user.email).catch(() => {});

  res.json({ ok: true, message: "Two-factor authentication has been disabled. You have been signed out of all devices." });
});

// ─── GET /api/auth/2fa/status ─────────────────────────────────────────────────
router.get("/auth/2fa/status", requireAuth, async (req, res) => {
  const [user] = await db.select({ totpEnabled: usersTable.totpEnabled }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ totpEnabled: user.totpEnabled });
});

export default router;
