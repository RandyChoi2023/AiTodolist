import * as React from "react";
import { data, redirect, useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/todo-list";

import { makeSSRClient } from "~/supa-client";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Separator } from "~/common/components/ui/separator";
import { cn } from "~/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/common/components/ui/alert-dialog";

import { getWeeklyTodos } from "./queries";
import {
  createWeeklyTodo,
  promoteWeeklyTodoToCore,
  rolloverExpiredWeeklyTodos,
  toggleWeeklyTodoCheck,
} from "./mutations";
import { deleteWeeklyTodoWithCore } from "./mutations";

function countChecks(t: any) {
  return [
    t.check_0,
    t.check_1,
    t.check_2,
    t.check_3,
    t.check_4,
    t.check_5,
    t.check_6,
  ].filter(Boolean).length;
}

// ✅ 요일(일~토). 한국어로 바꾸고 싶으면 ["일","월","화","수","목","금","토"]
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * ✅ period_start(YYYY-MM-DD)의 요일부터 7칸 라벨을 회전시켜 만든다.
 * - Date("YYYY-MM-DD")는 환경에 따라 UTC 해석 이슈가 있어서 (y,m,d)로 안전 파싱
 */
function getRollingDowLabels(periodStart: string) {
  const [y, m, d] = periodStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const startDay = start.getDay(); // 0=Sun ... 6=Sat
  return Array.from({ length: 7 }, (_, i) => DOW[(startDay + i) % 7]);
}

/**
 * ✅ (추천) 날짜 라벨이 더 직관적이면 이걸 사용해.
 * 현재는 요일 라벨을 쓰지만, 아래 함수로 쉽게 교체 가능.
 */
// function getRollingDateLabels(periodStart: string) {
//   const [y, m, d] = periodStart.split("-").map(Number);
//   const start = new Date(y, m - 1, d);
//   return Array.from({ length: 7 }, (_, i) => {
//     const dt = new Date(start);
//     dt.setDate(start.getDate() + i);
//     return `${dt.getMonth() + 1}/${dt.getDate()}`;
//   });
// }

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  // ✅ 기간 만료된 주간 todo는 히스토리 저장 후 자동 초기화
  await rolloverExpiredWeeklyTodos(client, { userId: user.id });

  const todos = await getWeeklyTodos(client, { userId: user.id });
  return data({ todos }, { headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  try {
    if (intent === "add") {
      const title = String(fd.get("title") ?? "").trim();
      if (!title) {
        return data(
          { ok: false, message: "Title required" },
          { headers, status: 400 }
        );
      }
      await createWeeklyTodo(client, { userId: user.id, title });
      return data({ ok: true }, { headers });
    }

    if (intent === "delete") {
      const id = String(fd.get("id") ?? "");
      // ✅ core list까지 함께 삭제
      await deleteWeeklyTodoWithCore(client, { userId: user.id, id });
      return data({ ok: true }, { headers });
    }

    if (intent === "toggle") {
      const id = String(fd.get("id") ?? "");
      const index = Number(fd.get("index") ?? -1);
      const value = String(fd.get("value") ?? "") === "true";
      if (!(index >= 0 && index <= 6)) {
        return data(
          { ok: false, message: "Invalid index" },
          { headers, status: 400 }
        );
      }
      await toggleWeeklyTodoCheck(client, { userId: user.id, id, index, value });
      return data({ ok: true }, { headers });
    }

    if (intent === "promote") {
      const id = String(fd.get("id") ?? "");
      await promoteWeeklyTodoToCore(client, { userId: user.id, id });
      return data({ ok: true }, { headers });
    }

    return data(
      { ok: false, message: "Unknown intent" },
      { headers, status: 400 }
    );
  } catch (e: any) {
    return data(
      { ok: false, message: e?.message ?? "Action failed" },
      { headers, status: 400 }
    );
  }
};

function MiniDayCheck({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-1 select-none",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-label={`Day ${label}`}
    >
      {/* ✅ 동그란 미니 버튼 */}
      <span
        className={cn(
          "h-7 w-7 rounded-full border flex items-center justify-center transition",
          "hover:shadow-sm",
          checked ? "bg-foreground border-foreground" : "bg-background",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        {/* 안쪽 점 */}
        <span
          className={cn(
            "h-2 w-2 rounded-full transition",
            checked
              ? "bg-background"
              : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
          )}
        />
      </span>

      {/* ✅ 라벨(요일/날짜) */}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}

export default function TodoPage() {
  const { todos } = useLoaderData<typeof loader>();
  const [title, setTitle] = React.useState("");

  // fetcher 분리: 상태 메시지/버튼 라벨 정확히
  const addFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const toggleFetcher = useFetcher();
  const promoteFetcher = useFetcher();

  const isAdding = addFetcher.state !== "idle";

  const deletingId =
    deleteFetcher.state !== "idle"
      ? String(deleteFetcher.formData?.get("id") ?? "")
      : "";

  const togglingKey =
    toggleFetcher.state !== "idle"
      ? `${String(toggleFetcher.formData?.get("id") ?? "")}:${String(
          toggleFetcher.formData?.get("index") ?? ""
        )}`
      : "";

  const promotingId =
    promoteFetcher.state !== "idle"
      ? String(promoteFetcher.formData?.get("id") ?? "")
      : "";

  const submitAdd = () => {
    const v = title.trim();
    if (!v || isAdding) return;
    addFetcher.submit({ intent: "add", title: v }, { method: "post" });
    setTitle("");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="h-14 max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="font-semibold">My to-do list for 7 days</div>
          <div className="text-xs text-muted-foreground">7 days reset</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Add */}
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="주간 체크할 습관/행동을 추가하세요. (예: React 15분)"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
            }}
          />
          <Button onClick={submitAdd} disabled={!title.trim() || isAdding}>
            {isAdding ? "추가중.." : "추가"}
          </Button>
        </div>
        {isAdding ? (
          <p className="mt-2 text-xs text-muted-foreground">추가중..</p>
        ) : null}

        <Separator className="my-4" />

        {/* List */}
        <div className="grid gap-3">
          {todos.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              Nothing here 🎉
            </div>
          ) : (
            todos.map((t: any) => {
              const checked = countChecks(t);
              const canPromote = checked >= 5 && !t.promoted_to_core;
              const rowDeleting = deletingId === t.id;

              // ✅ 시작일 요일부터 라벨 회전
              const labels = getRollingDowLabels(String(t.period_start));
              // 날짜 라벨이 더 좋으면:
              // const labels = getRollingDateLabels(String(t.period_start));

              return (
                <div key={t.id} className="border rounded-xl px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium break-words">{t.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t.period_start} ~ {t.period_end} · {checked}/7
                        {t.promoted_to_core ? " · ✅ Core 등록됨" : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Core promote 버튼: 5개 이상 체크 시 노출 */}
                      {canPromote ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            promoteFetcher.submit(
                              { intent: "promote", id: t.id },
                              { method: "post" }
                            )
                          }
                          disabled={promotingId === t.id}
                        >
                          {promotingId === t.id ? "생성중.." : "Core List 만들기"}
                        </Button>
                      ) : null}

                      {/* ✅ 삭제: Core 등록된 항목이면 confirm */}
                      {t.promoted_to_core ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={rowDeleting}
                            >
                              {rowDeleting ? "삭제중.." : "삭제"}
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>정말 삭제할까?</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 체크리스트는 이미 <b>Core List로 생성</b>되어 있어.
                                <br />
                                삭제하면 <b>연결된 Core List도 같이 삭제</b>돼.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteFetcher.submit(
                                    { intent: "delete", id: t.id },
                                    { method: "post" }
                                  )
                                }
                              >
                                삭제할게
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteFetcher.submit(
                              { intent: "delete", id: t.id },
                              { method: "post" }
                            )
                          }
                          disabled={rowDeleting}
                        >
                          {rowDeleting ? "삭제중.." : "삭제"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ✅ 7 미니 체크 버튼 */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-3">
                      {Array.from({ length: 7 }).map((_, idx) => {
                        const col = `check_${idx}` as keyof typeof t;
                        const checkedVal = Boolean(t[col]);

                        const key = `${t.id}:${idx}`;
                        const togglingThis = togglingKey === key;

                        return (
                          <MiniDayCheck
                            key={idx}
                            label={labels[idx]}
                            checked={checkedVal}
                            disabled={togglingThis}
                            onClick={() =>
                              toggleFetcher.submit(
                                {
                                  intent: "toggle",
                                  id: t.id,
                                  index: String(idx),
                                  value: String(!checkedVal),
                                },
                                { method: "post" }
                              )
                            }
                          />
                        );
                      })}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {promotingId === t.id ? "Core 생성중.." : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 에러 출력 */}
        {"data" in addFetcher && (addFetcher.data as any)?.ok === false ? (
          <p className="mt-4 text-sm text-red-500">
            {(addFetcher.data as any)?.message}
          </p>
        ) : null}
        {"data" in deleteFetcher && (deleteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">
            {(deleteFetcher.data as any)?.message}
          </p>
        ) : null}
        {"data" in toggleFetcher && (toggleFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">
            {(toggleFetcher.data as any)?.message}
          </p>
        ) : null}
        {"data" in promoteFetcher &&
        (promoteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">
            {(promoteFetcher.data as any)?.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}
