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

import { getWeeklyTodos, type WeeklyTodoRow } from "./queries";
import {
  createWeeklyTodo,
  promoteWeeklyTodoToCore,
  rolloverExpiredWeeklyTodos,
  toggleWeeklyTodoCheck,
  toggleWeeklyTodoCompleted, // ✅ mutations.ts에 있어야 함
} from "./mutations";
import { deleteWeeklyTodoWithCore } from "./mutations";

function countChecks(t: WeeklyTodoRow) {
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

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRollingDowLabels(periodStart: string) {
  const [y, m, d] = periodStart.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const startDay = start.getDay();
  return Array.from({ length: 7 }, (_, i) => DOW[(startDay + i) % 7]);
}

// ✅ 완료된 항목은 맨 아래로
function sortTodos(list: WeeklyTodoRow[]) {
  return [...list].sort((a, b) => {
    if (Boolean(a.is_completed) !== Boolean(b.is_completed)) {
      return a.is_completed ? 1 : -1; // 완료(true) -> 아래
    }

    // 같은 그룹 내에서는 기존 쿼리 정렬(ASC)을 유지하고 싶으면 아래처럼:
    const at = a.created_at ? Date.parse(a.created_at) : 0;
    const bt = b.created_at ? Date.parse(b.created_at) : 0;
    if (at !== bt) return at - bt;

    return String(a.id).localeCompare(String(b.id));
  });
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

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
        return data({ ok: false, message: "Title required" }, { headers, status: 400 });
      }
      await createWeeklyTodo(client, { userId: user.id, title });
      return data({ ok: true, intent }, { headers });
    }

    if (intent === "delete") {
      const id = String(fd.get("id") ?? "");
      await deleteWeeklyTodoWithCore(client, { userId: user.id, id });
      return data({ ok: true, intent, id }, { headers });
    }

    if (intent === "toggle") {
      const id = String(fd.get("id") ?? "");
      const index = Number(fd.get("index") ?? -1);
      const value = String(fd.get("value") ?? "") === "true";

      if (!(index >= 0 && index <= 6)) {
        return data({ ok: false, message: "Invalid index" }, { headers, status: 400 });
      }

      await toggleWeeklyTodoCheck(client, { userId: user.id, id, index, value });
      return data({ ok: true, intent, id, index, value }, { headers });
    }

    // ✅ Todo(한 줄) 전체 완료/취소
    if (intent === "complete") {
      const id = String(fd.get("id") ?? "");
      const value = String(fd.get("value") ?? "") === "true";
      await toggleWeeklyTodoCompleted(client, { userId: user.id, id, value });
      return data({ ok: true, intent, id, value }, { headers });
    }

    if (intent === "promote") {
      const id = String(fd.get("id") ?? "");
      await promoteWeeklyTodoToCore(client, { userId: user.id, id });
      return data({ ok: true, intent, id }, { headers });
    }

    return data({ ok: false, message: "Unknown intent" }, { headers, status: 400 });
  } catch (e: any) {
    return data({ ok: false, message: e?.message ?? "Action failed" }, { headers, status: 400 });
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
      className={cn("group relative flex flex-col items-center gap-1 select-none", disabled && "opacity-60 cursor-not-allowed")}
      aria-label={`Day ${label}`}
    >
      <span
        className={cn(
          "h-7 w-7 rounded-full border flex items-center justify-center transition",
          "hover:shadow-sm",
          checked ? "bg-indigo-500 border-indigo-500" : "bg-background border-muted-foreground/30",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full transition",
            checked ? "bg-indigo-50" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
          )}
        />
      </span>

      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}

export default function TodoPage() {
  const { todos } = useLoaderData<typeof loader>() as { todos: WeeklyTodoRow[] };
  const [title, setTitle] = React.useState("");

  // ✅ 로더 값 → 로컬 상태로 유지 (완료 표시 유지의 핵심)
  const [todosState, setTodosState] = React.useState<WeeklyTodoRow[]>(() => sortTodos(todos ?? []));

  React.useEffect(() => {
    setTodosState(sortTodos(todos ?? []));
  }, [todos]);

  const addFetcher = useFetcher<any>();
  const deleteFetcher = useFetcher<any>();
  const toggleFetcher = useFetcher<any>();
  const promoteFetcher = useFetcher<any>();
  const completeFetcher = useFetcher<any>();

  const isAdding = addFetcher.state !== "idle";

  const deletingId =
    deleteFetcher.state !== "idle" ? String(deleteFetcher.formData?.get("id") ?? "") : "";

  const togglingKey =
    toggleFetcher.state !== "idle"
      ? `${String(toggleFetcher.formData?.get("id") ?? "")}:${String(toggleFetcher.formData?.get("index") ?? "")}`
      : "";

  const promotingId =
    promoteFetcher.state !== "idle" ? String(promoteFetcher.formData?.get("id") ?? "") : "";

  const completingId =
    completeFetcher.state !== "idle" ? String(completeFetcher.formData?.get("id") ?? "") : "";

  const submitAdd = () => {
    const v = title.trim();
    if (!v || isAdding) return;
    addFetcher.submit({ intent: "add", title: v }, { method: "post" });
    setTitle("");
  };

  // ✅ OPTIMISTIC: 체크 토글 중이면 UI 즉시 반영
  const pendingToggle =
    toggleFetcher.state !== "idle"
      ? {
          id: String(toggleFetcher.formData?.get("id") ?? ""),
          index: String(toggleFetcher.formData?.get("index") ?? ""),
          value: String(toggleFetcher.formData?.get("value") ?? ""),
        }
      : null;

  // ✅ complete 성공 시: 로컬 상태에 반영 + 정렬(완료면 맨 아래)
  React.useEffect(() => {
    if (completeFetcher.state !== "idle") return;
    if (!completeFetcher.data) return;
    if (completeFetcher.data.ok !== true || completeFetcher.data.intent !== "complete") return;

    const id = String(completeFetcher.data.id ?? "");
    const value = Boolean(completeFetcher.data.value);

    if (!id) return;

    setTodosState((prev) => sortTodos(prev.map((t) => (t.id === id ? { ...t, is_completed: value } : t))));
  }, [completeFetcher.state, completeFetcher.data]);

  // ✅ delete 성공 시 로컬 제거
  React.useEffect(() => {
    if (deleteFetcher.state !== "idle") return;
    if (!deleteFetcher.data) return;
    if (deleteFetcher.data.ok !== true || deleteFetcher.data.intent !== "delete") return;

    const id = String(deleteFetcher.data.id ?? "");
    if (!id) return;

    setTodosState((prev) => prev.filter((t) => t.id !== id));
  }, [deleteFetcher.state, deleteFetcher.data]);

  // ✅ toggle 성공 시 로컬 반영(유지)
  React.useEffect(() => {
    if (toggleFetcher.state !== "idle") return;
    if (!toggleFetcher.data) return;
    if (toggleFetcher.data.ok !== true || toggleFetcher.data.intent !== "toggle") return;

    const id = String(toggleFetcher.data.id ?? "");
    const index = Number(toggleFetcher.data.index ?? -1);
    const value = Boolean(toggleFetcher.data.value);
    if (!id || index < 0 || index > 6) return;

    const col = `check_${index}` as keyof WeeklyTodoRow;

    setTodosState((prev) =>
      prev.map((t) => (t.id === id ? ({ ...t, [col]: value } as WeeklyTodoRow) : t))
    );
  }, [toggleFetcher.state, toggleFetcher.data]);

  // ✅ promote 성공 시 로컬 반영
  React.useEffect(() => {
    if (promoteFetcher.state !== "idle") return;
    if (!promoteFetcher.data) return;
    if (promoteFetcher.data.ok !== true || promoteFetcher.data.intent !== "promote") return;

    const id = String(promoteFetcher.data.id ?? "");
    if (!id) return;

    setTodosState((prev) => prev.map((t) => (t.id === id ? { ...t, promoted_to_core: true } : t)));
  }, [promoteFetcher.state, promoteFetcher.data]);

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

        <Separator className="my-4" />

        {/* List */}
        <div className="grid gap-3">
          {todosState.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">Nothing here 🎉</div>
          ) : (
            todosState.map((t) => {
              const checked = countChecks(t);
              const canPromote = checked >= 5 && !t.promoted_to_core && !t.is_completed;

              const rowDeleting = deletingId === t.id;
              const rowCompleting = completingId === t.id;

              const labels = getRollingDowLabels(String(t.period_start));

              return (
                <div key={t.id} className={cn("border rounded-xl px-4 py-4", t.is_completed && "opacity-70")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cn("font-medium break-words", t.is_completed && "line-through text-muted-foreground")}>
                        {t.title}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>
                          {t.period_start} ~ {t.period_end} · {checked}/7
                        </span>

                        {t.is_completed ? (
                          <span className="px-2 py-0.5 rounded-full border text-[10px]">✅ 완료</span>
                        ) : null}

                        {t.promoted_to_core ? (
                          <span className="px-2 py-0.5 rounded-full border text-[10px]">✅ Core 등록됨</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ✅ Todo 전체 완료/취소 */}
                      <Button
                        size="sm"
                        variant={t.is_completed ? "secondary" : "default"}
                        onClick={() =>
                          completeFetcher.submit(
                            { intent: "complete", id: t.id, value: String(!t.is_completed) },
                            { method: "post" }
                          )
                        }
                        disabled={rowDeleting || rowCompleting}
                        title={t.is_completed ? "완료 취소" : "이 Todo를 완료 처리"}
                      >
                        {rowCompleting ? "처리중.." : t.is_completed ? "완료됨" : "완료"}
                      </Button>

                      {/* ✅ Core List 만들기 -> 습관 형성 */}
                      {canPromote ? (
                        <Button
                          size="sm"
                          onClick={() => promoteFetcher.submit({ intent: "promote", id: t.id }, { method: "post" })}
                          disabled={promotingId === t.id || rowDeleting}
                        >
                          {promotingId === t.id ? "생성중.." : "습관 형성"}
                        </Button>
                      ) : null}

                      {/* 삭제 */}
                      {t.promoted_to_core ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={rowDeleting}>
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
                                onClick={() => deleteFetcher.submit({ intent: "delete", id: t.id }, { method: "post" })}
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
                          onClick={() => deleteFetcher.submit({ intent: "delete", id: t.id }, { method: "post" })}
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
                        const col = `check_${idx}` as keyof WeeklyTodoRow;
                        const serverChecked = Boolean(t[col]);

                        const key = `${t.id}:${idx}`;
                        const togglingThis = togglingKey === key;

                        const isThisPending =
                          pendingToggle &&
                          pendingToggle.id === String(t.id) &&
                          pendingToggle.index === String(idx);

                        const uiChecked = isThisPending ? pendingToggle.value === "true" : serverChecked;

                        return (
                          <MiniDayCheck
                            key={idx}
                            label={labels[idx]}
                            checked={uiChecked}
                            disabled={t.is_completed || togglingThis}
                            onClick={() => {
                              if (t.is_completed) return;
                              toggleFetcher.submit(
                                {
                                  intent: "toggle",
                                  id: t.id,
                                  index: String(idx),
                                  value: String(!serverChecked),
                                },
                                { method: "post" }
                              );
                            }}
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
          <p className="mt-4 text-sm text-red-500">{(addFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in deleteFetcher && (deleteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">{(deleteFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in toggleFetcher && (toggleFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">{(toggleFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in completeFetcher && (completeFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">{(completeFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in promoteFetcher && (promoteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">{(promoteFetcher.data as any)?.message}</p>
        ) : null}
      </main>
    </div>
  );
}