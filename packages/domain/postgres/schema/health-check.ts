import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
