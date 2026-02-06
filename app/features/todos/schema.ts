import { pgTable, serial, text, boolean, timestamp, uuid} from "drizzle-orm/pg-core";
import { profiles } from "app/features/users/schema";


export const todo = pgTable("todo_list", {
    id: serial("id").primaryKey(),
    text: text().notNull(),
    done: boolean().default(false),
    created_at: timestamp().defaultNow(),
    profile_id: uuid("profile_id")
    .notNull()
    .references(() => profiles.profile_id, { onDelete: "cascade" }),
});