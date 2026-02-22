import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

/**
 * ✅ 여기만 너 DB 테이블명에 맞춰 수정
 * - 예: "goals", "goal_list", "user_goals" 등
 */
const GOALS_TABLE = "goals";

/* -----------------------------
   ✅ Goals mutations
-------------------------------- */

export async function createGoal(
  client: SupabaseClient<Database>,
  {
    profileId,
    title,
    why,
    category,
    target,
  }: {
    profileId: string;
    title: string;
    why: string;
    category?: string;
    target?: string;
  }
) {
  const { data, error } = await client
    .from(GOALS_TABLE as any)
    .insert({
      profile_id: profileId,
      title,
      why: why ?? "",
      category: category ?? null,
      target: target ?? null,
      status: "active",
    } as any)
    .select("id, title, why, category, target, status, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleGoalStatus(
  client: SupabaseClient<Database>,
  {
    profileId,
    goalId,
    nextStatus,
  }: {
    profileId: string;
    goalId: string;
    nextStatus: "active" | "done";
  }
): Promise<{ id: string; status: "active" | "done" }> {
  const { data, error } = await client
    .from("goals")
    .update({ status: nextStatus })
    .eq("id", goalId)
    .eq("profile_id", profileId)
    .select("id, status")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("업데이트된 데이터가 없어.");

  return data as { id: string; status: "active" | "done" };
}

export async function deleteGoal(
  client: SupabaseClient<Database>,
  { profileId, goalId }: { profileId: string; goalId: string }
) {
  const { error } = await client
    .from(GOALS_TABLE as any)
    .delete()
    .eq("id", goalId)
    .eq("profile_id", profileId);

  if (error) throw new Error(error.message);
  return true;
}

export async function deleteDoneGoals(
  client: SupabaseClient<Database>,
  { profileId }: { profileId: string }
) {
  // 삭제한 row id들을 반환해서 UI에서 제거 가능하게
  const { data, error } = await client
    .from(GOALS_TABLE as any)
    .delete()
    .eq("profile_id", profileId)
    .eq("status", "done")
    .select("id");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/* -----------------------------
   ✅ Weekly todos / AI mutations
-------------------------------- */

// YYYY-MM-DD
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ✅ 서울 기준 이번 주 월~일
export function getSeoulWeekRangeISO() {
  const now = new Date();
  const seoulMs = now.getTime() + 9 * 60 * 60 * 1000;
  const seoul = new Date(seoulMs);

  const day = seoul.getUTCDay(); // 0~6
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(seoulMs);
  monday.setUTCDate(seoul.getUTCDate() - diffToMonday);

  const sunday = new Date(monday.getTime());
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    period_start: toISODate(monday),
    period_end: toISODate(sunday),
  };
}

export async function hasWeeklyTodosForThisWeek(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { period_start, period_end } = getSeoulWeekRangeISO();

  const { data, error } = await client
    .from("weekly_todos")
    .select("id")
    .eq("user_id", userId)
    .eq("period_start", period_start)
    .eq("period_end", period_end)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function createTodoistByAI(
  client: SupabaseClient<Database>,
  { userId, titles }: { userId: string; titles: string[] }
) {
  const cleaned = (titles ?? [])
    .map((t) => (t ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);

  if (cleaned.length < 2) {
    throw new Error("AI가 생성한 할 일이 너무 적어(최소 2개 필요).");
  }

  const { period_start, period_end } = getSeoulWeekRangeISO();

  const rows = cleaned.map((title) => ({
    user_id: userId,
    title,
    period_start,
    period_end,

    check_0: false,
    check_1: false,
    check_2: false,
    check_3: false,
    check_4: false,
    check_5: false,
    check_6: false,

    checks: [false, false, false, false, false, false, false] as any,
    promoted_to_core: false,
    core_list_id: null,
  }));

  const { data, error } = await client
    .from("weekly_todos")
    .insert(rows as any)
    .select("id, title, period_start, period_end, created_at");

  if (error) throw new Error(error.message);
  return data ?? [];
}

function getWeekRangeUTC(now = new Date()) {
  // UTC 기준 월요일 시작
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun,1=Mon...
  const diffToMon = (day + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - diffToMon);
  d.setUTCHours(0, 0, 0, 0);

  const start = d;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export async function countWeeklyTodosForThisWeek(
  client: any,
  { userId }: { userId: string }
) {
  const { startISO, endISO } = getWeekRangeUTC();

  const { count, error } = await client
    .from("weekly_todos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)                // ✅ 회원별 필터 (이게 핵심)
    .gte("created_at", startISO)          // ✅ 이번주 시작
    .lt("created_at", endISO);            // ✅ 이번주 끝(미포함)

  if (error) throw error;
  return count ?? 0;
}