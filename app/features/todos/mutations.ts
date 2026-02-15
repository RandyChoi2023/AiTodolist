import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";
import type { WeeklyTodoRow } from "./queries";


export async function addTodo(
  client: SupabaseClient<Database>,
  { userId, text }: { userId: string; text: string }
) {
  const { data, error } = await client
    .from("todo_list")
    .insert({
      profile_id: userId,
      text,
      done: false,
    })
    .select("id, text, done, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTodo(
  client: SupabaseClient<Database>,
  { userId, id }: { userId: string; id: number }
) {
  const { error } = await client
    .from("todo_list")
    .delete()
    .eq("id", id)
    .eq("profile_id", userId);

  if (error) throw new Error(error.message);
}

export async function toggleTodo(
  client: SupabaseClient<Database>,
  { userId, id, done }: { userId: string; id: number; done: boolean }
) {
  const { error } = await client
    .from("todo_list")
    .update({ done })
    .eq("id", id)
    .eq("profile_id", userId);

  if (error) throw new Error(error.message);
}

export async function clearDoneTodos(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { error } = await client
    .from("todo_list")
    .delete()
    .eq("profile_id", userId)
    .eq("done", true);

  if (error) throw new Error(error.message);
}




function calcCheckedCount(t: WeeklyTodoRow) {
  return [
    t.check_0, t.check_1, t.check_2, t.check_3, t.check_4, t.check_5, t.check_6,
  ].filter(Boolean).length;
}


export function computePeriod7Days(from = new Date()) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const toDateKST = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  return { periodStart: toDateKST(start), periodEnd: toDateKST(end) };
}

export async function createWeeklyTodo(
  client: SupabaseClient<Database>,
  { userId, title }: { userId: string; title: string }
) {
  const { periodStart, periodEnd } = computePeriod7Days(new Date());

  const { data, error } = await client
    .from("weekly_todos")
    .insert({
      user_id: userId,
      title,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .select(
      "id,title,period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6,promoted_to_core,created_at,updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWeeklyTodo(
  client: SupabaseClient<Database>,
  { userId, id }: { userId: string; id: string }
) {
  const { error } = await client
    .from("weekly_todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * ✅ weekly_todo 삭제 + (있다면) 연결된 core_list도 같이 삭제
 * - core_lists.source_weekly_todo_id = weekly_todos.id 를 기준으로 삭제
 */
export async function deleteWeeklyTodoWithCore(
  client: SupabaseClient<Database>,
  { userId, id }: { userId: string; id: string }
) {
  // 1) 연결된 core list 먼저 삭제 (있을 때만)
  const { error: coreErr } = await client
    .from("core_lists")
    .delete()
    .eq("user_id", userId)
    .eq("source_weekly_todo_id", id);

  if (coreErr) throw new Error(coreErr.message);

  // 2) weekly todo 삭제
  const { error: todoErr } = await client
    .from("weekly_todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (todoErr) throw new Error(todoErr.message);
}

export async function toggleWeeklyTodoCheck(
  client: SupabaseClient<Database>,
  { userId, id, index, value }: { userId: string; id: string; index: number; value: boolean }
) {
  const col = `check_${index}` as const;

  // updated_at까지 갱신하고 싶으면 트리거나 update에 포함
  const { error } = await client
    .from("weekly_todos")
    .update({ [col]: value, updated_at: new Date().toISOString() } as any)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * ✅ 7일 지나면 초기화(히스토리 저장 후 체크 리셋 + 기간 재설정)
 */
export async function rolloverExpiredWeeklyTodos(
  client: SupabaseClient<Database>,
  { userId, today = new Date() }: { userId: string; today?: Date }
) {
  
  const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  // 만료된 것들 조회
  const { data: expired, error } = await client
    .from("weekly_todos")
    .select(
      "id,title,period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6,promoted_to_core,created_at,updated_at"
    )
    .eq("user_id", userId)
    .lt("period_end", todayStr);

  if (error) throw new Error(error.message);
  if (!expired || expired.length === 0) return;

  // 히스토리 insert + reset update
  const { periodStart, periodEnd } = computePeriod7Days(today);

  for (const t of expired as any as WeeklyTodoRow[]) {
    const checked_count = calcCheckedCount(t);

    const { error: histErr } = await client.from("weekly_todo_history").insert({
      weekly_todo_id: t.id,
      user_id: userId,
      title: t.title,
      period_start: t.period_start,
      period_end: t.period_end,
      checked_count,
      promoted_to_core: t.promoted_to_core,
    });
    if (histErr) throw new Error(histErr.message);

    const { error: updErr } = await client
      .from("weekly_todos")
      .update({
        period_start: periodStart,
        period_end: periodEnd,
        check_0: false,
        check_1: false,
        check_2: false,
        check_3: false,
        check_4: false,
        check_5: false,
        check_6: false,
        promoted_to_core: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id)
      .eq("user_id", userId);

    if (updErr) throw new Error(updErr.message);
  }
}

export async function promoteWeeklyTodoToCore(
  client: SupabaseClient<Database>,
  { userId, id }: { userId: string; id: string }
) {
  // todo 가져오기
  const { data: t, error: selErr } = await client
    .from("weekly_todos")
    .select(
      "id,title,check_0,check_1,check_2,check_3,check_4,check_5,check_6,promoted_to_core"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (selErr) throw new Error(selErr.message);
  const checkedCount = [
    t.check_0, t.check_1, t.check_2, t.check_3, t.check_4, t.check_5, t.check_6,
  ].filter(Boolean).length;

  if (checkedCount < 5) {
    throw new Error("Need at least 5 checks to promote to Core List.");
  }

  if (!t.promoted_to_core) {
    const { error: coreErr } = await client.from("core_lists").insert({
      user_id: userId,
      title: t.title,
      source_weekly_todo_id: t.id,
    });
    if (coreErr) throw new Error(coreErr.message);

    const { error: updErr } = await client
      .from("weekly_todos")
      .update({ promoted_to_core: true, updated_at: new Date().toISOString() })
      .eq("id", t.id)
      .eq("user_id", userId);

    if (updErr) throw new Error(updErr.message);
  }
}
