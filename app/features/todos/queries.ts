import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

// ✅ todo_list: 체크해도 created_at은 안 바뀌므로 ASC로 고정 추천(점프 최소화)
// (지금 DESC라서 새로 추가된 건 위로 오지만, 체크 후 점프가 있으면 ASC가 더 안정적)
export async function getTodoList(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { data, error } = await client
    .from("todo_list")
    .select("id, text, done, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: true }); // ✅ 안정(고정 순서)

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type WeeklyTodoRow = {
  id: string;
  title: string;
  period_start: string; // date string
  period_end: string;   // date string
  check_0: boolean;
  check_1: boolean;
  check_2: boolean;
  check_3: boolean;
  check_4: boolean;
  check_5: boolean;
  check_6: boolean;

  // ✅ 추가: Todo(한 줄) 전체 완료 여부
  is_completed: boolean;

  promoted_to_core: boolean;
  created_at: string;
  updated_at: string;
};

// ✅ 서울 기준 "이번 주 월~일" (date-only)
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getSeoulWeekRangeISO() {
  const now = new Date();
  const seoulMs = now.getTime() + 9 * 60 * 60 * 1000;
  const seoul = new Date(seoulMs);

  const day = seoul.getUTCDay(); // 0(일)~6(토)
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

export async function getWeeklyTodos(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
) {
  const { period_start, period_end } = getSeoulWeekRangeISO();

  const { data, error } = await client
    .from("weekly_todos")
    .select(
      // ✅ is_completed 포함 (완료 표시 유지의 핵심)
      "id,title,period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6,is_completed,promoted_to_core,created_at,updated_at"
    )
    .eq("user_id", userId)
    // ✅ 이번 주만 가져오기 (재렌더/점프 줄임)
    .eq("period_start", period_start)
    .eq("period_end", period_end)
    // ✅ 체크해도 안 바뀌는 값으로 정렬 고정
    .order("created_at", { ascending: true })
    // ✅ created_at이 동일할 때도 순서 고정(가능하면)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);

  // ✅ DB에서 null로 올 수도 있으면 방어 (migration 직후/기존 데이터)
  const safe = (data ?? []).map((row: any) => ({
    ...row,
    is_completed: Boolean(row?.is_completed),
    promoted_to_core: Boolean(row?.promoted_to_core),
    check_0: Boolean(row?.check_0),
    check_1: Boolean(row?.check_1),
    check_2: Boolean(row?.check_2),
    check_3: Boolean(row?.check_3),
    check_4: Boolean(row?.check_4),
    check_5: Boolean(row?.check_5),
    check_6: Boolean(row?.check_6),
  }));

  return safe as WeeklyTodoRow[];
}