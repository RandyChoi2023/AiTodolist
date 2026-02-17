
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "react-router";
import type { Database } from "~/supa-client";

// all the mutations for the users features
export async function updateUserProfile(
    client: SupabaseClient<Database>,
    profileId: string,
    patch: {
      name: string; // ✅ 필수
      username: string; // ✅ 필수
      bio?: string | null;
      avatar?: string | null;
      todo_style?: Database["public"]["Enums"]["todo_style"] | null;
    }
  ) {
    type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
  
    // ✅ Insert 타입에서 name/username이 필수이므로 처음부터 포함
    const values: ProfileInsert = {
      profile_id: profileId,
      name: patch.name,
      username: patch.username,
      bio: patch.bio ?? null,
      avatar: patch.avatar ?? null,
      todo_style: patch.todo_style ?? null,
      // created_at/updated_at은 DB default를 쓰고 싶으면 빼도 됨.
      updated_at: new Date().toISOString(),
    };
  
    const { data, error } = await client
      .from("profiles")
      .upsert(values, { onConflict: "profile_id" })
      .select(
        "profile_id, avatar, name, username, headline, bio, todo_style, motivation_type, ai_styles, task_count, histories, created_at, updated_at"
      )
      .maybeSingle();
  
    if (error) throw new Error(error.message);
    if (!data) throw new Error("프로필 저장에 실패했어. (RLS 정책/권한 문제 가능)");
  
    return data;
  }
  
  
  
  export async function updateUserAvatar(
    client: SupabaseClient<Database>,
    profileId: string,
    avatar: string | null
  ) {
    const { error } = await client
      .from("profiles")
      .update({
        avatar,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);
  
    if (error) throw new Error(error.message);
    return true;
  }
  
  export const seeNotification = async( 
    client: SupabaseClient<Database>,
    { userId, notificationId } : { userId: string, notificationId: number} 
  ) => {
    const { error } = await client
    .from("notifications")
    .update({ seen: true })
    .eq("notification_id", notificationId)
    .eq("target_id", userId);
    if(error){
        throw error;
    }
  };