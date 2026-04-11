import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  avatarUrl: z
    .string()
    .max(MAX_AVATAR_BYTES, "Avatar too large (max 2 MB)")
    .optional(),
});

const SetUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed"),
});

router.get("/profile", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    uid: user.uid,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    phone: user.phone ?? null,
    hasPhone: !!user.phone,
    usernameSet: user.usernameSet,
    emailVerified: user.emailVerified,
    totpEnabled: user.totpEnabled,
    createdAt: user.createdAt,
  });
});

router.patch("/profile", requireAuth, async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  res.json({
    id: user.id,
    uid: user.uid,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    usernameSet: user.usernameSet,
  });
});

router.patch("/profile/username", requireAuth, async (req, res) => {
  const [currentUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!currentUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (currentUser.usernameSet) {
    res.status(403).json({ error: "Username can only be changed once" });
    return;
  }

  const parsed = SetUsernameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid username" });
    return;
  }

  const { username } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== currentUser.id) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ username, usernameSet: true, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  res.json({
    id: user.id,
    uid: user.uid,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    usernameSet: user.usernameSet,
  });
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password too long"),
});

router.patch("/profile/password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({ error: "Password change not available for this account" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: "New password must be different from current password" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id));

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.userId, req.user!.id));

  res.json({ success: true, message: "Password updated. Please log in again." });
});

// POST /api/auth/add-phone — save or update phone number for the authenticated user
router.post("/auth/add-phone", requireAuth, async (req, res) => {
  const { phone } = req.body as { phone?: string };

  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  await db
    .update(usersTable)
    .set({ phone: phone.trim() })
    .where(eq(usersTable.id, req.user!.id));

  res.json({ success: true, phone: phone.trim() });
});

// POST /api/profile/avatar — upload avatar image
router.post("/profile/avatar", requireAuth, async (req, res) => {
  try {
    // Ensure uploads directory exists at runtime
    const uploadDir = join(process.cwd(), "uploads", "avatars");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const { image } = req.body as { image?: string };

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Image data required" });
      return;
    }

    // Check if it's a data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: "Invalid image format. Expected base64 data URL" });
      return;
    }

    const [, mimeType, base64Data] = match;

    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      res.status(400).json({ 
        error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` 
      });
      return;
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_AVATAR_BYTES) {
      res.status(400).json({ 
        error: `Image too large (${(buffer.length / 1024 / 1024).toFixed(2)}MB). Max: 2MB` 
      });
      return;
    }

    // Generate unique filename
    const ext = mimeType.replace("image/", "").replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Generate URL (relative)
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user
    await db
      .update(usersTable)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user!.id));

    res.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error("[AVATAR UPLOAD] Error:", error);
    res.status(500).json({ error: "Failed to upload avatar: " + error.message });
  }
});

export default router;
