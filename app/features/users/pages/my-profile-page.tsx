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

export const meta: Route.MetaFunction = () => [{ title: "My Profile | AI To-Do List" }];

export default function MyProfilePage() {
  // 더미 데이터(나중에 supabase profile 붙일 자리)
  const user = {
    name: "Randy",
    username: "@username",
    email: "you@example.com",
    avatar: "https://avatars.githubusercontent.com/u/126791186?size=128",
    plan: "Free",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            아직 프로필 기능은 준비 중이야. 대신 설정/핵심 기능으로 바로 갈 수 있게 구성했어.
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
              <AvatarImage src={user.avatar} alt="User avatar" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <span>{user.name}</span>
                <Badge variant="secondary" className="font-medium">{user.plan}</Badge>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Bio</CardTitle>
                <CardDescription>공개 소개글 (준비중)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  아직 Bio를 설정하는 기능은 준비 중이야.
                  <br />
                  대신 목표/작업을 먼저 쌓아두면, 나중에 프로필이 더 “살아있는” 느낌이 돼.
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Role</CardTitle>
                <CardDescription>나를 가장 잘 표현하는 역할 (준비중)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Developer</Badge>
                  <Badge variant="outline">Designer</Badge>
                  <Badge variant="outline">PM</Badge>
                  <Badge variant="outline">Founder</Badge>
                  <Badge variant="outline">Other</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Role 선택/저장은 Settings 페이지에서 연결될 예정이야.
                </p>
              </CardContent>
            </Card>

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
              <CardDescription>streak / 목표 달성률 / 주간 리포트</CardDescription>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
