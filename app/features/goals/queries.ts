// import { browserClient } from "~/supa-client";

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";
export const getGoalList = async (client: SupabaseClient<Database> ,{ userId }:{userId: string}) => {

    const {data, error } = await client.from("goals").select(`
                                    id,
                                    profile_id,
                                    title,
                                    why,
                                    category,
                                    target,
                                    status,
                                    created_at,
                                    updated_at
        `).eq("profile_id", userId);
   

    
    if(error) throw new Error(error.message);

    return data;

}