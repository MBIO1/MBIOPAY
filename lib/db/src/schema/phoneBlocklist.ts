import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const phoneBlocklistTable = pgTable("phone_blocklist", {
  phone: text("phone").primaryKey(),
  reason: text("reason").notNull().default("Manual block"),
  blockedBy: text("blocked_by").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PhoneBlocklist = typeof phoneBlocklistTable.$inferSelect;
