import { pgTable, serial, text, bigint, integer, boolean } from "drizzle-orm/pg-core";

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  used: boolean("used").notNull().default(false),
  ip: text("ip"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;
export type InsertOtpCode = typeof otpCodesTable.$inferInsert;
