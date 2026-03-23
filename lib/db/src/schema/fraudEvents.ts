import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const fraudEventsTable = pgTable("fraud_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  orderId: integer("order_id"),
  phone: text("phone"),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull().default("medium"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FraudEvent = typeof fraudEventsTable.$inferSelect;
