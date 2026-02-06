// app/features/core-list/schema.ts 
import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    pgEnum,
    date,
    pgPolicy,
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";
  
  import { goals } from "app/features/goals/schema";
  
  // 우선순위 enum
  export const taskPriority = pgEnum("task_priority", [
    "low",
    "medium",
    "high",
  ]);
  

// 2. Supabase용 auth.uid() 헬퍼 정의 (필요시)
const authUid = sql`(auth.uid())`;

  export const coreList = pgTable("core_tasks", {
    // PK
    id: uuid("id").defaultRandom().primaryKey(),
  
    // 어떤 goal의 core task인지
    goal_id: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
  
    // task 내용
    title: text("title").notNull(),
    notes: text("notes"),
  
    // 상태
    done: boolean("done").notNull().default(false),
  
    priority: taskPriority("priority")
      .notNull()
      .default("low"),
  
    // 마감일 (YYYY-MM-DD)
    due: date("due"),
  
    // 생성/수정 시간
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }, (table) => [
    pgPolicy("core-tasks-insert-policy", {
      for: "insert",
      to: "authenticatedRole", 
      as: "permissive",
      // 보통 goal_id와 auth.uid()를 직접 비교하기보다, 
      // goals 테이블의 owner_id와 비교하는 로직이 더 일반적일 수 있습니다.
      withCheck: sql`${authUid} = (SELECT user_id FROM goals WHERE id = ${table.goal_id})`,
    }),
  ]);