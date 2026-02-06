import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { profiles } from "app/features/users/schema";

export const goalStatus = pgEnum("goal_status", ["active", "done"]);

export const goals = pgTable("goals", {
  // state의 id
  id: uuid("id").defaultRandom().primaryKey(),

  // 누구의 goal인지 (profiles.profile_id 참조)
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.profile_id, { onDelete: "cascade" }),

  // state 필드들
  title: text("title").notNull(),
  why: text("why").notNull(),
  category: text("category"),
  target: text("target"),

  status: goalStatus("status").notNull().default("active"),

  // state의 createdAt
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
