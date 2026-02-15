import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

export async function setCoreListStatus(
  client: SupabaseClient<Database>,
  {
    userId,
    id,
    status,
  }: { userId: string; id: string; status: "active" | "archived" }
) {
  const { error } = await client
    .from("core_lists")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * ✅ Core list 삭제
 * - 기본: core_lists row만 삭제 (weekly checklist는 남김)
 * - 원하면 아래 TODO처럼 weekly까지 같이 지우게 확장 가능
 */
export async function deleteCoreList(
  client: SupabaseClient<Database>,
  { userId, id }: { userId: string; id: string }
) {
  const { error } = await client
    .from("core_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  // (선택) weekly도 같이 지우고 싶으면:
  // 1) core_lists에서 source_weekly_todo_id를 먼저 읽고
  // 2) weekly_todos delete(user_id, id) 실행
}
