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


export async function getTodoList(
    client: SupabaseClient<Database>,
    { userId }: { userId: string }
  ) {
    const { data, error } = await client
      .from("todo_list")
      .select("id, text, done, created_at")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false });
  
    if (error) throw new Error(error.message);
    return data ?? [];
  }


// export const getTodoList = async (client: SupabaseClient<Database> ,{ userId }:{userId: string}) => {

//     const {data, error } = await client.from("todo_list_test_view").select(`
//         id, 
//         text, 
//         done`).eq("profile_id", userId);
   

//     if(error) throw new Error(error.message);

//     return data;

// }




export type WeeklyTodoRow = {
  id: string;
  title: string;
  period_start: string; // date string
  period_end: string;   // date string
  check_0: boolean;
  check_1: boolean;
  check_2: boolean;
  check_3: boolean;
  check_4: boolean;
  check_5: boolean;
  check_6: boolean;
  promoted_to_core: boolean;
  created_at: string;
  updated_at: string;
};

export async function getWeeklyTodos(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { data, error } = await client
    .from("weekly_todos")
    .select(
      "id,title,period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6,promoted_to_core,created_at,updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as WeeklyTodoRow[];
}