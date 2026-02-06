
import { pgSchema, pgTable, uuid ,text,timestamp, pgEnum, jsonb, bigint, primaryKey, integer} from "drizzle-orm/pg-core";
import { goals } from "../goals/schema";
import { todo } from "../todos/schema";
import { coreList } from "../cores/schema";

// all the models for the users features
export const users = pgSchema("auth").table("users", {
    id: uuid().primaryKey()
});
// constants.ts 에 따로 빼서 변수로 pgEnum 를 정의해 놓고 import 해야 함
export const todoStyles = pgEnum("todo_style", [
    "driver",
    "dreamer",
    "developer",
    "drifter",
]);

export const motivationType = pgEnum("motivation_type", [
    "reward",
    "progress",
    "meaning",
]);

export const aiStyles = pgEnum("ai_styles", [
    "soft",
    "strict",
    "playful",
]);

export const taskCount = pgEnum("task_count", [
    "few",
    "normal",
    "many",
]);

export const notificationType = pgEnum("notification_type", [
    "goal",
    "todo",
    "core",
    "mention",
])

export const profiles = pgTable("profiles", {
    profile_id: uuid().primaryKey().references(() => users.id, {onDelete:"cascade"}),
    avatar: text(),
    name: text().notNull(),
    username: text().notNull(),
    headline: text(),
    bio: text(),
    todo_style: todoStyles().default("driver"),
    motivation_type: motivationType().default("reward"), 
    ai_styles: aiStyles().default("soft"),
    task_count: taskCount().default("few"),
    histories: jsonb(),
    created_at: timestamp({withTimezone: true}).defaultNow(),
    updated_at: timestamp({withTimezone: true}).defaultNow(),
});
//(table) => [check("name", sql'LENGTH(${table.name}) < 100 )] // name 필드의 길이가 100 이하인지 체크

export const follows = pgTable("follows", {
    follower_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}),
    following_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}),
    created_at: timestamp({withTimezone: true}).defaultNow(),
});


export const notifications = pgTable("notifications", {
    notification_id: bigint({mode: "number"}).primaryKey().generatedAlwaysAsIdentity(),
    source_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}),
    goal_id: uuid().references(() => goals.id, {onDelete:"cascade"}),
    
    // ⚠️ 여기를 수정해야 합니다! todo_list.id가 serial(integer)이기 때문입니다.
    todo_list_id: integer("todo_list_id").references(() => todo.id, {onDelete:"cascade"}).notNull(),
    
    core_list_id: uuid().references(() => coreList.id, {onDelete:"cascade"}).notNull(),
    target_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}).notNull(),
    type: notificationType().notNull(),
    created_at: timestamp({withTimezone: true}).defaultNow(),
 });

export const messageRooms = pgTable("message_rooms", {
    room_id: bigint({mode: "number"}).primaryKey().generatedAlwaysAsIdentity(),
    created_at: timestamp({withTimezone: true}).defaultNow(),
});  

export const messageRoomMembers = pgTable("message_room_member",{
    room_id: bigint({mode: "number"}).references(() => messageRooms.room_id, {onDelete:"cascade"}),
    profile_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}),
    created_at: timestamp({withTimezone: true}).defaultNow(),
},(table) => [
    primaryKey({ name: 'message_room_members_pk',columns: [table.room_id,table.profile_id]}),
]);

export const messages = pgTable("messages", {
    message_id: bigint({mode: "number"}).primaryKey().generatedAlwaysAsIdentity(),
    room_id: bigint({mode: "number"}).references(() => messageRooms.room_id, {onDelete:"cascade"}),
    sender_id: uuid().references(() => profiles.profile_id, {onDelete:"cascade"}),
    content: text().notNull(),
    created_at: timestamp({withTimezone: true}).defaultNow(),
});
