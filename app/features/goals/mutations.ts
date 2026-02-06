import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

type CreateGoalArgs = {
    profileId: string;
    title: string;
    why: string;
    category?: string;
    target?: string;
  };

export const createGoal = async (
  client: SupabaseClient<Database>,
  { profileId, title, why, category, target }: CreateGoalArgs
) => {
  const { data, error } = await client
    .from("goals")
    .insert({
      profile_id: profileId,
      title,
      why,
      category,
      target,
      status: "active",
    })
    // ✅ insert 결과를 반드시 받기
    .select("id, title, why, category, target, status, created_at, profile_id")
    .single();

  if (error) throw new Error(error.message);

  // ✅ 이제 data는 null이 아니라 "생성된 row" 1개
  return data;
};

export const deleteGoal = async (
    client: SupabaseClient<Database>,
    { profileId, goalId }: { profileId: string; goalId: string }
  ) => {
    const { data, error } = await client
      .from("goals")
      .delete()
      .eq("id", goalId)
      .eq("profile_id", profileId)
      .select("id")
      .single();
  
    if (error) throw new Error(error.message);
    return data;
  };
  
  export const deleteDoneGoals = async (
    client: SupabaseClient<Database>,
    { profileId }: { profileId: string }
  ) => {
    const { data, error } = await client
      .from("goals")
      .delete()
      .eq("profile_id", profileId)
      .eq("status", "done")
      .select("id");
  
    if (error) throw new Error(error.message);
    return data ?? [];
  };

// app/features/goals/mutations.ts
export const toggleGoalStatus = async (
  client: SupabaseClient<Database>,
  {
    profileId,
    goalId,
    nextStatus,
  }: { profileId: string; goalId: string; nextStatus: "active" | "done" }
) => {
  const { data, error } = await client
    .from("goals")
    .update({ status: nextStatus })
    .eq("id", goalId)
    .eq("profile_id", profileId)
    .select("id, status")
    .single();

  if (error) throw new Error(error.message);
  return data; // { id, status }
};

  