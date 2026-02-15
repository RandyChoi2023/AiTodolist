
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";


// export const getCoreList = async (client: SupabaseClient<Database> ,{ userId }:{userId: string}) => {

//     const {data, error } = await client.from("core_tasks").select(`
//                                     id,
//                                     goal_id,
//                                     title,
//                                     notes,
//                                     done,
//                                     priority,
//                                     due,
//                                     created_at,
//                                     updated_at,
//                                     profile_id`,).eq("profile_id", userId);
 

//     if(error) throw new Error(error.message);

//     return data;

// }

export type CoreListRow = {
    id: string;
    user_id: string;
    title: string;
    status: "active" | "archived";
    source_weekly_todo_id: string | null;
    created_at: string;
  };
  
  export async function getCoreList(
    client: SupabaseClient<Database>,
    { userId }: { userId: string }
  ) {
    const { data, error } = await client
      .from("core_lists")
      .select("id,user_id,title,status,source_weekly_todo_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  
    if (error) throw new Error(error.message);
    return (data ?? []) as CoreListRow[];
  }


  export type WeeklyHistoryRow = {
    id: string;
    period_start: string;
    period_end: string;
    checks: boolean[];
    created_at: string;
  };
  
  export async function getWeeklyHistoryByCore(
    client: SupabaseClient<Database>,
    {
      userId,
      coreListId,
    }: { userId: string; coreListId: string }
  ) {
    const { data, error } = await client
      .from("weekly_todos")
      .select("id, period_start, period_end, checks, created_at")
      .eq("user_id", userId)
      .eq("core_list_id", coreListId)
      .order("period_start", { ascending: false });
  
    if (error) throw new Error(error.message);
    return (data ?? []) as WeeklyHistoryRow[];
  }