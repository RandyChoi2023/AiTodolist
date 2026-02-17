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
  };




export type NotificationWithSource = {
  notification_id: number;
  type: Database["public"]["Enums"]["notification_type"];
  seen: boolean;
  created_at: string;
  source: {
    profile_id: string;
    name: string | null;
    avatar: string | null;
  } | null;
};

export async function getNotifications(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<NotificationWithSource[]> {
  const { data, error } = await client
    .from("notifications")
    .select(
      `
      notification_id,
      type,
      seen,
      created_at,
      source:profiles!notifications_source_id_profiles_profile_id_fk(
        profile_id,
        name,
        avatar
      )
    `
    )
    .eq("target_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationWithSource[];
}


export async function hasUnreadNotifications(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { data, error } = await client
    .from("notifications")
    .select("notification_id")
    .eq("target_id", userId)
    .eq("seen", false)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}