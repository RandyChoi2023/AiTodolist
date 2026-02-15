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

export async function getUserProfile(
    client: SupabaseClient<Database>,
    profileId: string
  ) {
    const { data, error } = await client
      .from("profiles")
      .select(
        "profile_id, avatar, name, username, headline, bio, todo_style, motivation_type, ai_styles, task_count, histories, created_at, updated_at"
      )
      .eq("profile_id", profileId)
      .maybeSingle(); // ✅ single() -> maybeSingle()
  
    if (error) throw new Error(error.message);
    return data; // ✅ data는 Row | null
  }
  
export async function updateUserProfile(
  client: SupabaseClient<Database>,
  profileId: string,
  patch: {
    name?: string;
    username?: string;
    bio?: string | null;
    avatar?: string | null;
    todo_style?: Database["public"]["Enums"]["todo_style"] | null;
  }
) {
   
  const { data, error } = await client
    .from("profiles")
    .update({
      name: patch.name,
      username: patch.username,
      bio: patch.bio ?? null,
      avatar: patch.avatar ?? null,
      todo_style: patch.todo_style ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profileId)
    .select(
      "profile_id, avatar, name, username, headline, bio, todo_style, motivation_type, ai_styles, task_count, histories, created_at, updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return data;
}


