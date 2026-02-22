import * as React from "react";
import type { Route } from "./+types/dashboard-page";
import { Link } from "react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Progress } from "~/common/components/ui/progress";

import {
  BarChart3Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FlameIcon,
  SparklesIcon,
  TargetIcon,
  ArrowRightIcon,
} from "lucide-react";

import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries"; // ✅ 너 프로젝트 경로 맞추기

export const meta: Route.MetaFunction = () => [{ title: "Dashboard | AI To-Do List" }];

type MiniStat = {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
};

type PlannedFeature = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
};

type WeeklyTodoRow = {
  id: string;
  user_id: string;
  title: string;
  period_start: string; // date (YYYY-MM-DD)
  period_end: string; // date (YYYY-MM-DD)
  check_0: boolean | null;
  check_1: boolean | null;
  check_2: boolean | null;
  check_3: boolean | null;
  check_4: boolean | null;
  check_5: boolean | null;
  check_6: boolean | null;
  is_completed: boolean | null;
  updated_at: string;
};

const TABLE = "weekly_todos";

/** YYYY-MM-DD -> Date(UTC midnight) */
function parseDateOnlyUTC(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0));
}

function toISODateOnlyUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function getCheckValue(row: WeeklyTodoRow, dayIndex: number) {
  switch (dayIndex) {
    case 0:
      return !!row.check_0;
    case 1:
      return !!row.check_1;
    case 2:
      return !!row.check_2;
    case 3:
      return !!row.check_3;
    case 4:
      return !!row.check_4;
    case 5:
      return !!row.check_5;
    case 6:
      return !!row.check_6;
    default:
      return false;
  }
}

function countTrueChecksInRow(row: WeeklyTodoRow) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (getCheckValue(row, i)) n++;
  return n;
}

function calcStreakFromRows(rows: WeeklyTodoRow[], todayUTC: Date) {
  // 날짜별로 "하루라도 체크된 적 있냐"를 만든 다음, today부터 역순으로 연속 체크된 날짜 count
  const doneByDate = new Set<string>();

  for (const r of rows) {
    const ps = parseDateOnlyUTC(r.period_start);
    for (let i = 0; i < 7; i++) {
      if (!getCheckValue(r, i)) continue;
      const day = addDaysUTC(ps, i);
      doneByDate.add(toISODateOnlyUTC(day));
    }
  }

  let streak = 0;
  for (let back = 0; back < 365; back++) {
    const day = addDaysUTC(todayUTC, -back);
    const key = toISODateOnlyUTC(day);
    if (doneByDate.has(key)) streak++;
    else break;
  }
  return streak;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  // ✅ UTC 기준으로 통일 (period_start/end가 date라서 UTC가 안전)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayISO = toISODateOnlyUTC(todayUTC);

  // 1) 이번 주 rows: period_start <= today <= period_end
  const { data: weekRowsRaw, error: weekErr } = await client
    .from(TABLE)
    .select(
      "id,user_id,title,period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6,is_completed,updated_at"
    )
    .eq("user_id", userId)
    .lte("period_start", todayISO)
    .gte("period_end", todayISO);

  const weekRows = (weekRowsRaw ?? []) as WeeklyTodoRow[];

  // 2) Today: 오늘 요일 체크 true 개수 / 오늘 대상 총 개수(=이번주 rows 수)
  let todayDone = 0;
  let todayTotal = weekRows.length;

  for (const r of weekRows) {
    const ps = parseDateOnlyUTC(r.period_start);
    const idx = Math.floor((todayUTC.getTime() - ps.getTime()) / (1000 * 60 * 60 * 24)); // 0..6
    if (idx >= 0 && idx <= 6 && getCheckValue(r, idx)) todayDone++;
  }

  // 3) This week: 전체 체크(7일 * row수) 대비 true 비율
  const weekChecksTotal = weekRows.length * 7;
  const weekChecksDone = weekRows.reduce((sum, r) => sum + countTrueChecksInRow(r), 0);
  const weekPct = weekChecksTotal > 0 ? Math.round((weekChecksDone / weekChecksTotal) * 100) : 0;

  // 4) Streak 계산용: 최근 12주 정도 rows 가져오기 (period_end >= today-90d)
  const fromUTC = addDaysUTC(todayUTC, -90);
  const fromISO = toISODateOnlyUTC(fromUTC);

  const { data: streakRowsRaw, error: streakErr } = await client
    .from(TABLE)
    .select("period_start,check_0,check_1,check_2,check_3,check_4,check_5,check_6")
    .eq("user_id", userId)
    .gte("period_end", fromISO);

  const streakRows = (streakRowsRaw ?? []) as WeeklyTodoRow[];
  const streak = calcStreakFromRows(streakRows, todayUTC);

  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return {
    userId,
    stats: {
      todayDone,
      todayTotal,
      todayPct,

      streak,

      weekChecksDone,
      weekChecksTotal,
      weekPct,

      weeklyTodosCount: weekRows.length,
    },
    debug: {
      errors: {
        week: weekErr ? String(weekErr.message ?? weekErr) : null,
        streak: streakErr ? String(streakErr.message ?? streakErr) : null,
      },
    },
  };
};

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { stats } = loaderData;

  const mini: MiniStat[] = [
    {
      label: "Today",
      value: String(stats.todayDone),
      icon: <CheckCircle2Icon className="size-4" />,
      hint: "오늘 체크된 개수",
    },
    {
      label: "Streak",
      value: `${stats.streak}d`,
      icon: <FlameIcon className="size-4" />,
      hint: "연속 체크 일수",
    },
    {
      label: "This week",
      value: `${stats.weekPct}%`,
      icon: <CalendarDaysIcon className="size-4" />,
      hint: `주간 체크 (${stats.weekChecksDone}/${stats.weekChecksTotal})`,
    },
    {
      // ✅ 기존 "Goals" 라벨 유지하고 싶으면 label만 Goals로 바꿔도 됨
      label: "Weekly todos",
      value: String(stats.weeklyTodosCount),
      icon: <TargetIcon className="size-4" />,
      hint: "이번 주 항목 수",
    },
  ];

  const planned: PlannedFeature[] = [
    {
      title: "Goal Progress Overview",
      desc: "목표별 진행률과 남은 작업을 한눈에 보여줄 예정이야.",
      icon: <TargetIcon className="size-4" />,
      badge: "Planned",
    },
    {
      title: "Streak & Habit Analytics",
      desc: "연속 달성, 요일별 패턴, 실패 원인까지 분석해서 보여줄 예정.",
      icon: <FlameIcon className="size-4" />,
      badge: "Planned",
    },
    {
      title: "AI Insights",
      desc: "AI가 “오늘 뭐부터 할지”, “어디서 막혔는지” 코멘트해줄 예정.",
      icon: <SparklesIcon className="size-4" />,
      badge: "Planned",
    },
    {
      title: "Charts & Weekly Report",
      desc: "주간/월간 리포트 + 그래프 카드로 예쁘게 구성할 예정.",
      icon: <BarChart3Icon className="size-4" />,
      badge: "Planned",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            아직 설계 중 입니다. 
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="secondary">
            <Link to="/goals">
              목표 보기 <ArrowRightIcon className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/to-do-lists">
              To-do List로 이동 <ArrowRightIcon className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5" />
            준비 중 (Coming soon)
          </CardTitle>
          <CardDescription>
            지금은 Goals / Core List가 메인이고, Dashboard는 “통계 + 요약 + AI 인사이트” 중심으로 곧 확장할 예정이야.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {mini.map((s) => (
              <Card key={s.label} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="text-muted-foreground">{s.icon}</div>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{s.value}</div>
                  {s.hint ? <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div> : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Today momentum</CardTitle>
                <CardDescription>오늘은 “작게 시작해서 하나 끝내기”가 목표</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily completion</span>
                  <span className="font-medium">
                    {stats.todayPct}% ({stats.todayDone}/{stats.todayTotal})
                  </span>
                </div>
                <Progress value={stats.todayPct} />
                <div className="text-xs text-muted-foreground">팁: “2분짜리 작업” 하나만 만들어도 흐름이 살아나.</div>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/my-core-list/all-lists">Core List 열기</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Quick actions</CardTitle>
                <CardDescription>자주 쓰는 바로가기</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/goals">
                    내 목표 <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/to-do-lists">
                    To-do lists <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/my-core-list/easy">
                    Easy core <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link to="/motivation">
                    Motivation <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">What’s coming</h2>
          <Badge variant="secondary">Roadmap</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planned.map((p) => (
            <Card key={p.title} className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-muted-foreground">{p.icon}</span>
                  {p.title}
                  {p.badge ? (
                    <Badge variant="outline" className="ml-auto">
                      {p.badge}
                    </Badge>
                  ) : null}
                </CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}