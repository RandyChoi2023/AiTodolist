import * as React from "react";
import type { Route } from "./+types/my-profile-page";
import { Link } from "react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";

import {
  ArrowRightIcon,
  BadgeCheckIcon,
  MailIcon,
  PencilIcon,
  SettingsIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";

import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries"; // ✅ 너 프로젝트 경로 맞추기

export const meta: Route.MetaFunction = () => [{ title: "My Profile | AI To-Do List" }];

type ProfileRow = {
  profile_id: string;
  avatar: string | null;
  name: string | null;
  username: string | null;
  headline: string | null;
  bio: string | null;

  todo_style: string | null; // USER-DEFINED → 일단 string으로 받기
  motivation_type: string | null;
  ai_styles: string | null;
  task_count: string | null;

  histories: unknown | null;
  created_at: string;
  updated_at: string;
};

type WeeklyTodoRow = {
  period_start: string; // date
  period_end: string; // date
  check_0: boolean | null;
  check_1: boolean | null;
  check_2: boolean | null;
  check_3: boolean | null;
  check_4: boolean | null;
  check_5: boolean | null;
  check_6: boolean | null;
};

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
  const doneByDate = new Set<string>();
  for (const r of rows) {
    const ps = parseDateOnlyUTC(r.period_start);
    for (let i = 0; i < 7; i++) {
      if (!getCheckValue(r, i)) continue;
      doneByDate.add(toISODateOnlyUTC(addDaysUTC(ps, i)));
    }
  }
  let streak = 0;
  for (let back = 0; back < 365; back++) {
    const key = toISODateOnlyUTC(addDaysUTC(todayUTC, -back));
    if (doneByDate.has(key)) streak++;
    else break;
  }
  return streak;
}

function fallbackNameFromEmail(email: string | null | undefined) {
  if (!email) return "User";
  const base = email.split("@")[0] ?? "User";
  return base.length ? base : "User";
}
function normalizeUsername(u: string | null | undefined) {
  if (!u) return null;
  return u.startsWith("@") ? u : `@${u}`;
}
function fallbackUsername(userId: string) {
  return `@user-${userId.slice(0, 6)}`;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = await makeSSRClient(request);

  const userId = await getLoggedInUserId(client);

  // 1) auth email
  const { data: authData } = await client.auth.getUser();
  const email = authData?.user?.email ?? null;

  // 2) profiles row: profile_id = userId
  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select(
      "profile_id,avatar,name,username,headline,bio,todo_style,motivation_type,ai_styles,task_count,histories,created_at,updated_at"
    )
    .eq("profile_id", userId)
    .maybeSingle();

  const p = (profile ?? null) as ProfileRow | null;

  // 3) weekly_todos 기반 활동 요약 (옵션: 지금 바로 프로필을 “살게” 하는 용)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayISO = toISODateOnlyUTC(todayUTC);

  const { data: weekRowsRaw } = await client
    .from("weekly_todos")
    .select("period_start,period_end,check_0,check_1,check_2,check_3,check_4,check_5,check_6")
    .eq("user_id", userId)
    .lte("period_start", todayISO)
    .gte("period_end", todayISO);

  const weekRows = (weekRowsRaw ?? []) as WeeklyTodoRow[];
  const weekChecksTotal = weekRows.length * 7;
  const weekChecksDone = weekRows.reduce((sum, r) => sum + countTrueChecksInRow(r), 0);
  const weekPct = weekChecksTotal > 0 ? Math.round((weekChecksDone / weekChecksTotal) * 100) : 0;

  const fromISO = toISODateOnlyUTC(addDaysUTC(todayUTC, -90));
  const { data: streakRowsRaw } = await client
    .from("weekly_todos")
    .select("period_start,check_0,check_1,check_2,check_3,check_4,check_5,check_6")
    .eq("user_id", userId)
    .gte("period_end", fromISO);

  const streakRows = (streakRowsRaw ?? []) as WeeklyTodoRow[];
  const streak = calcStreakFromRows(streakRows, todayUTC);

  const user = {
    id: userId,
    name: p?.name || fallbackNameFromEmail(email),
    username: normalizeUsername(p?.username) ?? fallbackUsername(userId),
    email: email ?? "—",
    avatar: p?.avatar ?? null,

    headline: p?.headline ?? null,
    bio: p?.bio ?? null,

    // preferences (일단 보여주기만)
    todo_style: p?.todo_style ?? null,
    motivation_type: p?.motivation_type ?? null,
    ai_styles: p?.ai_styles ?? null,
    task_count: p?.task_count ?? null,

    // plan은 아직 구독 붙이기 전이면 Free
    plan: "Free",
    verified: false,
  };

  return {
    user,
    activity: {
      weekPct,
      weekChecksDone,
      weekChecksTotal,
      streak,
      weeklyItems: weekRows.length,
    },
    debug: {
      profileErr: profileErr ? String(profileErr.message ?? profileErr) : null,
    },
  };
};

export default function MyProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, activity } = loaderData;

  // role 대신: 너 profiles엔 role이 없으니까 "스타일/동기/AI"를 표시해주자
  const prefBadges = [
    user.todo_style ? { label: `Todo: ${user.todo_style}`, variant: "secondary" as const } : null,
    user.motivation_type ? { label: `Motivation: ${user.motivation_type}`, variant: "outline" as const } : null,
    user.ai_styles ? { label: `AI: ${user.ai_styles}`, variant: "outline" as const } : null,
    user.task_count ? { label: `Limit: ${user.task_count}`, variant: "outline" as const } : null,
  ].filter(Boolean) as Array<{ label: string; variant: "secondary" | "outline" }>;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            프로필은 점점 “살아있는 페이지”로 만드는 중입니다. (요약/설정/활동 기록)
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link to="/my/settings">
              설정 <SettingsIcon className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/goals">
              목표로 이동 <ArrowRightIcon className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={user.avatar ?? undefined} alt="User avatar" />
              <AvatarFallback>{user.name?.slice(0, 2)?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span>{user.name}</span>
                <Badge variant="secondary" className="font-medium">
                  {user.plan}
                </Badge>
                <Badge variant="outline" className="font-medium flex items-center gap-1">
                  <BadgeCheckIcon className="size-4" /> Verified (soon)
                </Badge>
              </CardTitle>

              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="flex items-center gap-1">
                  <UserRoundIcon className="size-4" /> {user.username}
                </span>
                <span className="hidden sm:block text-muted-foreground">•</span>
                <span className="flex items-center gap-1">
                  <MailIcon className="size-4" /> {user.email}
                </span>
              </CardDescription>

              {user.headline ? (
                <div className="text-sm text-muted-foreground">{user.headline}</div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" disabled className="gap-2">
              <PencilIcon className="size-4" />
              프로필 수정 (준비중)
            </Button>
            <Button asChild className="gap-2">
              <Link to="/subscribe">
                업그레이드 <SparklesIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <Separator />

          {/* Preferences badges */}
          {prefBadges.length ? (
            <div className="flex flex-wrap gap-2">
              {prefBadges.map((b) => (
                <Badge key={b.label} variant={b.variant}>
                  {b.label}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              아직 스타일 설정이 비어있어. Settings에서 todo_style / motivation_type / ai_styles 연결하면 여기가 살아나.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Bio */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Bio</CardTitle>
                <CardDescription>공개 소개글</CardDescription>
              </CardHeader>
              <CardContent>
                {user.bio ? (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{user.bio}</div>
                ) : (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                    아직 Bio를 설정하는 기능은 준비 중이야.
                    <br />
                    대신 목표/작업을 먼저 쌓아두면, 나중에 프로필이 더 “살아있는” 느낌이 돼.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Activity</CardTitle>
                <CardDescription>이번 주 요약</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly progress</span>
                  <span className="font-medium">{activity.weekPct}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  checks {activity.weekChecksDone}/{activity.weekChecksTotal} • items {activity.weeklyItems}
                </div>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Streak</span>
                    <span className="font-semibold">{activity.streak} days</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    하루에 1개라도 체크하면 streak가 이어지는 방식이야.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
                <CardDescription>계정 관련 바로가기</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/my/settings">
                    Settings <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/my/notifications">
                    Notifications <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/my/messages">
                    Messages <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Nice “next” section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">다음에 여기에 들어갈 것들</CardTitle>
          <CardDescription>Profile 페이지가 “이쁘게 의미있게” 보이도록 할 계획</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Public Profile</CardTitle>
              <CardDescription>공개 링크 + 소개 + 뱃지</CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Activity Summary</CardTitle>
              <CardDescription>streak / 주간 리포트 / 성장 히스토리(histories)</CardDescription>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}