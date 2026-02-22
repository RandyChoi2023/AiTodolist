
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
    avatar?: string | null; // ✅ 아바타는 명시적으로 보낼 때만 반영
    todo_style?: Database["public"]["Enums"]["todo_style"] | null;
  }
) {
  type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

  // ✅ upsert payload 구성
  // - avatar는 patch에 "키가 존재할 때만" 포함 (undefined면 아예 제외)
  const values: ProfileInsert = {
    profile_id: profileId,
    name: patch.name,
    username: patch.username,
    bio: patch.bio ?? null,
    todo_style: patch.todo_style ?? null,
    updated_at: new Date().toISOString(),
  };

  // ✅ avatar는 "명시적으로 전달된 경우에만" 업데이트
  if (Object.prototype.hasOwnProperty.call(patch, "avatar")) {
    (values as any).avatar = patch.avatar ?? null; // null을 주면 의도적으로 제거 가능
  }

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


  export const sendMessage = async (
    client: SupabaseClient<Database>,
    { fromUserId, toUserId,content}: { fromUserId: string; toUserId: string; content: string}
  ) => {
    const {data, error } = await client.rpc("get_room", {
      from_user_id: fromUserId,
      to_user_id: toUserId,
    }).maybeSingle();
    if(error) {
      throw error;
    }
    if(data?.room_id){
      await client.from("messages").insert({
        room_id: data.room_id,
        sender_id: fromUserId,
        content,
      });
    } else {
      const { data: roomData, error:roomError} = await client
        .from("message_rooms")
        .insert({})
        .select("room_id")
        .single();
      if(roomError) {
        throw roomError;
      }
      await client.from("message_room_member").insert([{
          room_id: roomData.room_id,
          profile_id: fromUserId,
        },{
          room_id: roomData.room_id,
          profile_id: toUserId,
        }
      ]);

      await client.from("messages").insert({
        room_id: roomData.room_id,
        sender_id: fromUserId,
        content,
      });
      return roomData.room_id;
    }
  }