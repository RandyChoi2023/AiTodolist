// import db from "~/db";
// import { eq } from "drizzle-orm";
// import { todo } from "../todos/schema";

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

// export const getTodoList = async (userId: string) => {
//     const todos = await db
//         .select({
//             id: todo.id,
//             text: todo.text,
//             done: todo.done,
//             created_at: todo.createdAt,
//         })
//         .from(todo)
//         .where(eq(todo.profile_id, userId));
//     return todos;
// };



export const getTodoList = async (client: SupabaseClient<Database> ,{ userId }:{userId: string}) => {

    const {data, error } = await client.from("todo_list_test_view").select(`
        id, 
        text, 
        done`).eq("profile_id", userId);
   

    if(error) throw new Error(error.message);

    return data;

}