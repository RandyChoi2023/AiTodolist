
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";


export const getCoreList = async (client: SupabaseClient<Database> ,{ userId }:{userId: string}) => {

    const {data, error } = await client.from("core_tasks").select(`
                                    id,
                                    goal_id,
                                    title,
                                    notes,
                                    done,
                                    priority,
                                    due,
                                    created_at,
                                    updated_at,
                                    profile_id`,).eq("profile_id", userId);
 

    if(error) throw new Error(error.message);

    return data;

}