// app/features/question/question-page.tsx
import * as React from "react";
import {
  Form,
  data,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/question-page";

import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries"; // ✅ 경로 맞춰서 수정해줘
import { sendMessage } from "~/features/users/mutations"; // ✅ 경로 맞춰서 수정해줘

import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Button } from "~/common/components/ui/button";
import { Separator } from "~/common/components/ui/separator";

export const meta: Route.MetaFunction = () => [
  { title: "Question | AI To-Do List" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  if (!userData?.user) {
    return redirect("/auth/login", { headers });
  }

  return data({}, { headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return data({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const { client, headers } = makeSSRClient(request);

  // 로그인 확인
  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  // ✅ 관리자 프로필 ID (ENV)
  const adminId = process.env.ADMIN_PROFILE_ID;
  if (!adminId) {
    return data(
      { ok: false, message: "ADMIN_PROFILE_ID is not set" },
      { status: 500, headers }
    );
  }

  const fromUserId = await getLoggedInUserId(client);

  const fd = await request.formData();
  const title = String(fd.get("title") ?? "").trim();
  const category = String(fd.get("category") ?? "General").trim();
  const content = String(fd.get("content") ?? "").trim();

  if (!content) {
    return data(
      { ok: false, message: "내용을 입력해줘" },
      { status: 400, headers }
    );
  }

  // ✅ 메시지 본문 포맷(관리자가 보기 좋게)
  const body =
    `[문의] ${category}${title ? ` · ${title}` : ""}\n` +
    `${content}`;

  const messageRoomId = await sendMessage(client, {
    fromUserId,
    toUserId: adminId,
    content: body,
  });

  return redirect(`/my/messages/${messageRoomId}`, { headers });
};


export default function QuestionPage() {
    const actionData = useActionData<typeof action>();
    const nav = useNavigation();
    const busy = nav.state !== "idle";
  
    return (
      <div className="min-h-screen">
        <header className="border-b">
          <div className="h-14 max-w-2xl mx-auto px-4 flex items-center justify-between">
            <div className="font-semibold">문의하기</div>
            <div className="text-xs text-muted-foreground">
              작성하신 내용은 관리자에게 전달됩니다.
            </div>
          </div>
        </header>
  
        <main className="max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>문의 내용을 작성해주세요</CardTitle>
            </CardHeader>
  
            <CardContent className="space-y-4">
              <Form method="post" className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">카테고리</label>
                  <select
                    name="category"
                    defaultValue="General"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="General">일반 문의</option>
                    <option value="Bug">버그 신고</option>
                    <option value="Feature Request">기능 요청</option>
                    <option value="Billing">결제 관련</option>
                    <option value="Account">계정 관련</option>
                  </select>
                </div>
  
                <div className="grid gap-2">
                  <label className="text-sm font-medium">제목 (선택)</label>
                  <Input name="title" placeholder="예: 체크 버튼이 느리게 반응합니다." />
                </div>
  
                <div className="grid gap-2">
                  <label className="text-sm font-medium">내용</label>
                  <Textarea
                    name="content"
                    rows={7}
                    placeholder="문의 내용을 자세히 작성해 주세요. (재현 방법, 기대 결과 등)"
                    className="resize-none"
                  />
                </div>
  
                {actionData?.ok === false ? (
                  <p className="text-sm text-red-500">{actionData.message}</p>
                ) : null}
  
                <Separator />
  
                <div className="flex justify-end">
                  <Button type="submit" disabled={busy}>
                    {busy ? "전송 중입니다..." : "관리자에게 문의 보내기"}
                  </Button>
                </div>
  
                <p className="text-xs text-muted-foreground">
                  문의를 보내시면 자동으로 메시지 페이지로 이동하여 관리자와 대화를 이어가실 수 있습니다.
                </p>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  