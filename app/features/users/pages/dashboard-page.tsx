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

export default function DashboardPage() {
  // 더미 데이터(나중에 supabase 붙일 자리)
  const stats: MiniStat[] = [
    { label: "Today", value: "—", icon: <CheckCircle2Icon className="size-4" />, hint: "오늘 완료 수" },
    { label: "Streak", value: "—", icon: <FlameIcon className="size-4" />, hint: "연속 달성" },
    { label: "This week", value: "—", icon: <CalendarDaysIcon className="size-4" />, hint: "주간 진행" },
    { label: "Goals", value: "—", icon: <TargetIcon className="size-4" />, hint: "활성 목표" },
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
            아직 설계 중이야. 대신 핵심 기능으로 바로 이동할 수 있게 준비해뒀어.
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
            {stats.map((s) => (
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
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} />
                <div className="text-xs text-muted-foreground">
                  팁: “2분짜리 작업” 하나만 만들어도 흐름이 살아나.
                </div>
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
                  {p.badge ? <Badge variant="outline" className="ml-auto">{p.badge}</Badge> : null}
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
