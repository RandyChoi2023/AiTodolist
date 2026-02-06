// all the queries for the users features

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "react-router";
import type { Database } from "~/supa-client";

export const getLoggedInUserId = async (client: SupabaseClient<Database>) => {
    const { data, error } = await client.auth.getUser();
    if( error || data.user === null){
        throw redirect("/auth/login");
    }
    return data.user.id;
};