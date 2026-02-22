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

export async function getGoalById(
    client: SupabaseClient,
    params: { userId: string; goalId: string }
  ) {
    const { userId, goalId } = params;
  
    const { data, error } = await client
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .eq("profile_id", userId)
      .single();
  
    if (error) {
      console.error("[getGoalById] error:", error);
      return null;
    }
  
    return data;
  }


  // features/goals/queries.ts (예시)
// 네 프로젝트 구조에 맞게 파일 위치는 조정해도 돼.

export async function getProfileByUserId(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<
  Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "profile_id" | "todo_style" | "motivation_type" | "ai_styles" | "task_count" | "headline" | "bio" | "avatar" | "name" | "username"
  > | null
> {
  const { data, error } = await client
    .from("profiles")
    .select(
      "profile_id, todo_style, motivation_type, ai_styles, task_count, headline, bio, avatar, name, username"
    )
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}