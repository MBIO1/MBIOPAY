import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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
    usernameSet: user.usernameSet,
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

export default router;
