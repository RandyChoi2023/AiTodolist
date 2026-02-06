import * as React from "react";

import { Separator } from "~/common/components/ui/separator";
import { cn } from "~/lib/utils";

import { makeSSRClient } from "~/supa-client";
import { data, useLoaderData } from "react-router";
import type { Route } from "./+types/weekly-page";


// -------------------------
// Types
// -------------------------
type WeeklyStat = {
  goalId: string;
  title: string;

  // 주간 목표치(예: 팔굽혀펴기 10개)
  weeklyTarget: number;

  // 지난주 완료 수(예: 7)
  lastWeekDone: number;

  // 이번주 완료 수(예: 4)
  thisWeekDone: number;
};

type ReportRow = WeeklyStat & {
  lastWeekGap: number; // 목표 - 지난주
  thisWeekGap: number; // 목표 - 이번주
  deltaDone: number; // 이번주 - 지난주
  trend: "closer" | "farther" | "same";
  message: string;
};

// -------------------------
// Helpers
// -------------------------
function getWeekRangeLabel(date = new Date()) {
  // 간단히 "YYYY-MM-DD" ~ "YYYY-MM-DD" 형식 (월요일 시작)
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = (day + 6) % 7; // Mon=0
  const mon = new Date(d);
  mon.setDate(d.getDate() - diffToMon);

  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return `${fmt(mon)} ~ ${fmt(sun)}`;
}

function buildMessage(r: ReportRow) {
  // 더 자연스러운 한국어 톤 (너가 예시로 준 스타일)
  const { title, weeklyTarget, lastWeekDone, thisWeekDone, trend } = r;

  const lastRate = Math.round((lastWeekDone / weeklyTarget) * 100);
  const thisRate = Math.round((thisWeekDone / weeklyTarget) * 100);

  if (trend === "closer") {
    return `${title}: 목표 ${weeklyTarget}개 중 지난주는 ${lastWeekDone}개(${lastRate}%) 했고, 이번주는 ${thisWeekDone}개(${thisRate}%) 해서 목표에 더 가까워졌어. 👍 꾸준히 이어가자!`;
  }
  if (trend === "farther") {
    return `${title}: 목표 ${weeklyTarget}개 중 지난주는 ${lastWeekDone}개(${lastRate}%) 했는데, 이번주는 ${thisWeekDone}개(${thisRate}%)로 조금 멀어졌어. 😅 다시 리듬만 잡으면 돼. 이번 주는 작은 단위로 쪼개서 해보자!`;
  }
  return `${title}: 목표 ${weeklyTarget}개 기준으로 지난주(${lastWeekDone}개)와 이번주(${thisWeekDone}개)가 비슷해. 안정적으로 유지 중! 다음 주엔 +1만 올려보자.`;
}

function toReportRow(s: WeeklyStat): ReportRow {
  const lastWeekGap = s.weeklyTarget - s.lastWeekDone;
  const thisWeekGap = s.weeklyTarget - s.thisWeekDone;
  const deltaDone = s.thisWeekDone - s.lastWeekDone;

  let trend: ReportRow["trend"] = "same";
  if (Math.abs(thisWeekGap) < Math.abs(lastWeekGap)) trend = "closer";
  else if (Math.abs(thisWeekGap) > Math.abs(lastWeekGap)) trend = "farther";

  const row: ReportRow = {
    ...s,
    lastWeekGap,
    thisWeekGap,
    deltaDone,
    trend,
    message: "", // 아래에서 채움
  };

  row.message = buildMessage(row);
  return row;
}

function trendBadge(trend: ReportRow["trend"]) {
  switch (trend) {
    case "closer":
      return "bg-green-50 text-green-700 border-green-200";
    case "farther":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
}

// -------------------------
// Loader (SSR)
// -------------------------
export const loader = async ({ request }: Route.LoaderArgs) => {
  
//   if(request.method !== "POST") {
//     return new Response(null, { status: 404});
//   }
//   const headerCheck = request.headers.get("X-RANDY");

//   if(!headerCheck || headerCheck !== "X-RANDY"){
//     return new Response(null, { status: 404});
//   }
  
  const { headers } = makeSSRClient(request);

  
  
  

  // ✅ 여기서는 샘플 데이터로 화면 완성
  // 나중에 DB 붙일 때 getWeeklyStats(userId, weekRange) 같은 걸로 교체하면 됨.
  const stats: WeeklyStat[] = [
    {
      goalId: "pushup",
      title: "팔굽혀펴기",
      weeklyTarget: 10,
      lastWeekDone: 7,
      thisWeekDone: 4,
    },
    {
      goalId: "english",
      title: "영어 문장 10개 만들기",
      weeklyTarget: 10,
      lastWeekDone: 6,
      thisWeekDone: 8,
    },
  ];

  return data(
    {
      stats,
      weekLabel: getWeekRangeLabel(new Date()),
    },
    { headers }
  );
};

// -------------------------
// Page
// -------------------------
export default function WeeklyReportPage() {
  const { stats, weekLabel } = useLoaderData<typeof loader>();

  const rows = React.useMemo(() => stats.map(toReportRow), [stats]);

  const summary = React.useMemo(() => {
    const closer = rows.filter((r) => r.trend === "closer").length;
    const farther = rows.filter((r) => r.trend === "farther").length;
    const same = rows.filter((r) => r.trend === "same").length;
    return { closer, farther, same, total: rows.length };
  }, [rows]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="h-14 max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="font-semibold">Weekly Report</div>
          <div className="text-xs text-muted-foreground">{weekLabel}</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Summary */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">이번 주 요약</div>
            <div className="text-xs text-muted-foreground">
              총 {summary.total}개 목표
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">가까워짐</div>
              <div className="text-xl font-semibold">{summary.closer}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">멀어짐</div>
              <div className="text-xl font-semibold">{summary.farther}</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">유지</div>
              <div className="text-xl font-semibold">{summary.same}</div>
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            포인트는 “완벽”이 아니라 “리듬”이야. 이번 주 수치가 내려가도,
            다음 주에 다시 올리면 돼.
          </div>
        </div>

        <Separator className="my-4" />

        {/* Rows */}
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.goalId} className="border rounded-xl p-4 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    주간 목표: {r.weeklyTarget} · 지난주: {r.lastWeekDone} ·
                    이번주: {r.thisWeekDone}
                  </div>
                </div>

                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    trendBadge(r.trend)
                  )}
                >
                  {r.trend === "closer"
                    ? "가까워짐"
                    : r.trend === "farther"
                    ? "멀어짐"
                    : "유지"}
                </span>
              </div>

              {/* Progress bar (간단) */}
              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground">이번주 진행</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground/70"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((r.thisWeekDone / r.weeklyTarget) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>지난주 Δ {r.deltaDone >= 0 ? `+${r.deltaDone}` : r.deltaDone}</span>
                  <span>
                    목표까지 {Math.max(0, r.thisWeekGap)} 남음
                  </span>
                </div>
              </div>

              <div className="text-sm">{r.message}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
