import * as React from "react";
import * as z from "zod";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Checkbox } from "~/common/components/ui/checkbox";
import { Separator } from "~/common/components/ui/separator";
import { cn } from "~/lib/utils";

import { getGoalList } from "./queries";
import { makeSSRClient } from "~/supa-client";

import { data, useFetcher, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/goals-list";
import { getLoggedInUserId } from "../users/queries";
import { createGoal, deleteGoal, deleteDoneGoals, toggleGoalStatus } from "./mutations";

const createGoalSchema = z.object({
  title: z.string().min(1),
  why: z.string().optional().default(""),
  category: z.string().optional(),
  target: z.string().optional(),
});

type GoalStatus = "active" | "done";

type Goal = {
  id: string;
  title: string;
  why: string;
  category?: string;
  target?: string;
  status: GoalStatus;
  createdAt: number;
};

const MAX_ACTIVE_GOALS = 20;

// ✅ UI용 주간 한도 (서버가 최종 방어)
// - 여기선 goal 단위로 3개까지만 "생성 완료" 표시
const MAX_AI_GOALS_PER_WEEK = 3;

/**
 * ✅ Seoul week range (YYYY-MM-DD)
 */
function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getSeoulWeekRangeISO() {
  const now = new Date();
  const seoulMs = now.getTime() + 9 * 60 * 60 * 1000; // +09:00
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

// ✅ userId를 포함해 계정별로 localStorage 분리
function getAiReadyStorageKey(userId: string) {
  const { period_start, period_end } = getSeoulWeekRangeISO();
  return `aiReadyGoals:${userId}:${period_start}~${period_end}`;
}

function loadAiReadyGoalIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(getAiReadyStorageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((x) => String(x)));
  } catch {
    return new Set();
  }
}

function saveAiReadyGoalIds(userId: string, next: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getAiReadyStorageKey(userId), JSON.stringify(Array.from(next)));
  } catch {
    // ignore
  }
}

/**
 * ✅ loader
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const goals = await getGoalList(client, { userId });
  return data({ goals, userId }, { headers });
};

/**
 * ✅ action (UI용 CRUD만)
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const { client, headers } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const formData = await request.formData();
  const intent = String(formData.get("_intent") ?? "create");

  // ✅ 상태 토글
  if (intent === "toggleStatus") {
    const goalId = String(formData.get("goalId") ?? "");
    const nextStatus = String(formData.get("nextStatus") ?? "");

    if (!goalId || (nextStatus !== "active" && nextStatus !== "done")) {
      return data({ ok: false as const, error: "goalId/nextStatus가 올바르지 않아." }, { status: 400, headers });
    }

    try {
      const row = await toggleGoalStatus(client, {
        profileId: userId,
        goalId,
        nextStatus: nextStatus as "active" | "done",
      });

      return data(
        { ok: true as const, intent: "toggleStatus" as const, goalId: row.id, status: row.status },
        { headers }
      );
    } catch (e: any) {
      return data({ ok: false as const, error: e?.message ?? "상태 변경 실패" }, { status: 400, headers });
    }
  }

  // ✅ 삭제(단건)
  if (intent === "delete") {
    const goalId = String(formData.get("goalId") ?? "");
    if (!goalId) return data({ ok: false as const, error: "goalId가 필요해." }, { status: 400, headers });

    try {
      await deleteGoal(client, { profileId: userId, goalId });
      return data({ ok: true as const, intent: "delete" as const, goalId }, { headers });
    } catch (e: any) {
      return data({ ok: false as const, error: e?.message ?? "삭제 실패" }, { status: 400, headers });
    }
  }

  // ✅ 완료 목표 전체 삭제
  if (intent === "deleteDone") {
    try {
      const rows = await deleteDoneGoals(client, { profileId: userId });
      const deletedIds = (rows ?? []).map((r: any) => r.id);
      return data({ ok: true as const, intent: "deleteDone" as const, deletedIds }, { headers });
    } catch (e: any) {
      return data({ ok: false as const, error: e?.message ?? "삭제 실패" }, { status: 400, headers });
    }
  }

  // ✅ 목표 생성(create)
  const raw = {
    title: String(formData.get("title") ?? ""),
    why: String(formData.get("why") ?? ""),
    category: String(formData.get("category") ?? ""),
    target: String(formData.get("target") ?? ""),
  };

  const parsed = createGoalSchema.safeParse({
    title: raw.title.trim(),
    why: raw.why.trim() || "",
    category: raw.category.trim() || undefined,
    target: raw.target.trim() || undefined,
  });

  if (!parsed.success) {
    return data({ ok: false as const, error: "title은 필수야." }, { status: 400, headers });
  }

  try {
    const goal = await createGoal(client, { profileId: userId, ...(parsed.data as any) });
    if (!goal) return data({ ok: false as const, error: "목표 생성에 실패했어요." }, { status: 400, headers });
    return data({ ok: true as const, intent: "create" as const, goal }, { headers });
  } catch (e: any) {
    console.error("[goals/create] error:", e);
    return data({ ok: false as const, error: e?.message ?? "목표 생성 중 오류가 발생했어요." }, { status: 400, headers });
  }
};

export default function GoalsListPage() {
  const { goals, userId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const createFetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher<typeof action>();
  const statusFetcher = useFetcher<typeof action>();

  // ✅ AI fetcher는 /generate-todo 로 POST만 때림
  const aiFetcher = useFetcher<{
    ok: boolean;
    intent?: "generateTodos";
    goalId?: string;
    createdCount?: number;
    titles?: string[];
    error?: string;
  }>();

  const [lastToggle, setLastToggle] = React.useState<{ goalId: string; nextStatus: GoalStatus } | null>(null);

  // ✅ localStorage 복원(주간 + userId 단위)
  const [aiReadyGoalIds, setAiReadyGoalIds] = React.useState<Set<string>>(() => loadAiReadyGoalIds(userId));
  const [aiPendingGoalId, setAiPendingGoalId] = React.useState<string | null>(null);

  const [goalsState, setGoalsState] = React.useState<Goal[]>(
    () =>
      (goals ?? []).map((t: any) => ({
        id: t.id,
        title: t.title ?? "",
        why: t.why ?? "",
        category: t.category ?? undefined,
        target: t.target ?? undefined,
        status: (t.status as GoalStatus) ?? "active",
        createdAt: t.created_at ? Date.parse(t.created_at) : Date.now(),
      }))
  );

  const [title, setTitle] = React.useState("");
  const [why, setWhy] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [hideDone, setHideDone] = React.useState(false);

  const activeCount = React.useMemo(() => goalsState.filter((g) => g.status === "active").length, [goalsState]);
  const total = goalsState.length;
  const doneCount = React.useMemo(() => goalsState.filter((g) => g.status === "done").length, [goalsState]);

  const visibleGoals = React.useMemo(() => {
    const list = hideDone ? goalsState.filter((g) => g.status !== "done") : goalsState;
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [goalsState, hideDone]);

  function setErrorTemp(message: string) {
    setError(message);
    window.setTimeout(() => setError(null), 2500);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!title.trim()) {
      e.preventDefault();
      setErrorTemp("title은 필수야.");
      return;
    }
    if (activeCount >= MAX_ACTIVE_GOALS) {
      e.preventDefault();
      setErrorTemp(`설정 할 수 있는 목표는 최대 ${MAX_ACTIVE_GOALS}개까지만 가능합니다.`);
      return;
    }
  }

  // ✅ create 처리
  React.useEffect(() => {
    if (createFetcher.state !== "idle") return;
    if (!createFetcher.data) return;

    if (!createFetcher.data.ok) {
      setErrorTemp(createFetcher.data.error ?? "추가에 실패했어.");
      return;
    }
    if (createFetcher.data.intent !== "create") return;

    const t: any = createFetcher.data.goal;
    setGoalsState((prev) => [
      {
        id: t.id,
        title: t.title ?? "",
        why: t.why ?? "",
        category: t.category ?? undefined,
        target: t.target ?? undefined,
        status: (t.status as GoalStatus) ?? "active",
        createdAt: t.created_at ? Date.parse(t.created_at) : Date.now(),
      },
      ...prev,
    ]);

    setTitle("");
    setWhy("");
    setCategory("");
    setTarget("");
    setError(null);
  }, [createFetcher.state, createFetcher.data]);

  // ✅ delete 처리
  React.useEffect(() => {
    if (deleteFetcher.state !== "idle") return;
    if (!deleteFetcher.data) return;

    if (!deleteFetcher.data.ok) {
      setErrorTemp(deleteFetcher.data.error ?? "삭제에 실패했어.");
      return;
    }

    if (deleteFetcher.data.intent === "delete") {
      const goalId = deleteFetcher.data.goalId;
      setGoalsState((prev) => prev.filter((g) => g.id !== goalId));

      // ✅ localStorage 상태도 같이 정리
      setAiReadyGoalIds((prev) => {
        const next = new Set(prev);
        next.delete(goalId);
        saveAiReadyGoalIds(userId, next);
        return next;
      });

      if (aiPendingGoalId === goalId) setAiPendingGoalId(null);
      return;
    }

    if (deleteFetcher.data.intent === "deleteDone") {
      const ids = new Set(deleteFetcher.data.deletedIds ?? []);
      setGoalsState((prev) => prev.filter((g) => !ids.has(g.id)));

      setAiReadyGoalIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        saveAiReadyGoalIds(userId, next);
        return next;
      });

      if (aiPendingGoalId && ids.has(aiPendingGoalId)) setAiPendingGoalId(null);
      return;
    }
  }, [deleteFetcher.state, deleteFetcher.data, aiPendingGoalId, userId]);

  // ✅ toggle 처리
  React.useEffect(() => {
    if (statusFetcher.state !== "idle") return;
    if (!statusFetcher.data) return;

    if (!statusFetcher.data.ok) {
      setErrorTemp(statusFetcher.data.error ?? "상태 변경에 실패했어.");

      if (!lastToggle) return;
      const rollbackStatus: GoalStatus = lastToggle.nextStatus === "done" ? "active" : "done";
      setGoalsState((prev) => prev.map((g) => (g.id === lastToggle.goalId ? { ...g, status: rollbackStatus } : g)));
      setLastToggle(null);
      return;
    }

    if (statusFetcher.data.intent === "toggleStatus") {
      const goalId = statusFetcher.data.goalId;
      const status = statusFetcher.data.status as GoalStatus;
      setGoalsState((prev) => prev.map((g) => (g.id === goalId ? { ...g, status } : g)));
      setLastToggle(null);
    }
  }, [statusFetcher.state, statusFetcher.data, lastToggle]);

  // ✅ AI 처리(/generate-todo 결과 수신)
  React.useEffect(() => {
    if (aiFetcher.state !== "idle") return;
    if (!aiFetcher.data) return;

    const pending = aiPendingGoalId;
    setAiPendingGoalId(null);

    if (!aiFetcher.data.ok) {
      setErrorTemp(aiFetcher.data.error ?? "AI 생성에 실패했어.");
      return;
    }

    if (aiFetcher.data.intent === "generateTodos") {
      const gid = aiFetcher.data.goalId ?? pending;
      if (!gid) return;

      setAiReadyGoalIds((prev) => {
        const next = new Set(prev);
        next.add(gid);
        saveAiReadyGoalIds(userId, next);
        return next;
      });
    }
  }, [aiFetcher.state, aiFetcher.data, aiPendingGoalId, userId]);

  function toggleDone(id: string) {
    const current = goalsState.find((g) => g.id === id);
    if (!current) return;

    const nextStatus: GoalStatus = current.status === "done" ? "active" : "done";
    if (nextStatus === "active" && activeCount >= MAX_ACTIVE_GOALS) {
      setErrorTemp(`최대 설정 할 수 있는 목표가 ${MAX_ACTIVE_GOALS} 입니다.`);
      return;
    }

    setGoalsState((prev) => prev.map((g) => (g.id === id ? { ...g, status: nextStatus } : g)));
    setLastToggle({ goalId: id, nextStatus });

    statusFetcher.submit({ _intent: "toggleStatus", goalId: id, nextStatus }, { method: "post" });
  }

  function requestDeleteGoal(goalId: string) {
    deleteFetcher.submit({ _intent: "delete", goalId }, { method: "post" });
  }

  function requestDeleteDone() {
    deleteFetcher.submit({ _intent: "deleteDone" }, { method: "post" });
  }

  function requestGenerateTodos(goalId: string) {
    // ✅ UI에서만 막아주기(서버가 최종 방어)
    if (aiReadyGoalIds.has(goalId)) return;

    if (aiReadyGoalIds.size >= MAX_AI_GOALS_PER_WEEK) {
      setErrorTemp(`이번 주 AI 생성은 최대 ${MAX_AI_GOALS_PER_WEEK}개 목표까지만 가능해!`);
      return;
    }

    const goal = goalsState.find((g) => g.id === goalId);
    if (!goal) return;
    if (goal.status === "done") return;

    setAiPendingGoalId(goalId);

    // ✅ 핵심: action을 반드시 /generate-todo 로 명시
    aiFetcher.submit({ goalId }, { method: "post", action: "/generate-todo" });
  }

  const isCreating = createFetcher.state !== "idle";
  const isDeleting = deleteFetcher.state !== "idle";
  const isToggling = statusFetcher.state !== "idle";
  const isAiBusy = aiFetcher.state !== "idle";

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="h-14 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="font-semibold">Goals</div>
          <div className="text-xs text-muted-foreground">
            Active {activeCount}/{MAX_ACTIVE_GOALS} · Done {doneCount}/{total}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <createFetcher.Form method="post" className="grid gap-2" onSubmit={onSubmit}>
          <input type="hidden" name="_intent" value="create" />

          <Input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이번에 꼭 이루고 싶은 목표는 무엇인가요?"
          />
          <Input
            name="why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="이 목표가 중요한 이유를 알려주세요 (선택)"
          />

          <div className="flex gap-2">
            <Input
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="분야 예: 영어/운동/커리어 (선택)"
            />
            <Input
              name="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="성공 기준 한 줄 (선택)"
            />
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <Button type="submit" disabled={!title.trim() || activeCount >= MAX_ACTIVE_GOALS || isCreating}>
            {isCreating ? "추가 중..." : "목표 추가하기"}
          </Button>

          {activeCount >= MAX_ACTIVE_GOALS ? (
            <div className="text-xs text-muted-foreground">
              목표는 최대 {MAX_ACTIVE_GOALS}개까지. 다른 목표를 완료하면 추가할 수 있습니다.
            </div>
          ) : null}
        </createFetcher.Form>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setHideDone((v) => !v)}
          >
            {hideDone ? "완료 목표 보기" : "완료 목표 숨기기"}
          </button>

          <Button variant="ghost" size="sm" onClick={requestDeleteDone} disabled={doneCount === 0 || isDeleting}>
            {isDeleting ? "삭제 중..." : "완료 목표 삭제"}
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-2">
          {visibleGoals.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">아직 목표가 없어 🎯</div>
          ) : (
            visibleGoals.map((g) => {
              const isDone = g.status === "done";
              const aiReady = aiReadyGoalIds.has(g.id);
              const aiPending = aiPendingGoalId === g.id && isAiBusy;

              const weekQuotaReached = aiReadyGoalIds.size >= MAX_AI_GOALS_PER_WEEK && !aiReady;
              const aiButtonDisabled = isDone || aiReady || isAiBusy || weekQuotaReached;

              return (
                <div key={g.id} className={cn("border rounded-xl px-3 py-3 grid gap-2", isDone && "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isDone} onCheckedChange={() => toggleDone(g.id)} disabled={isToggling} />

                    <div className="flex-1 min-w-0">
                      <div className={cn("font-medium text-sm break-words", isDone && "line-through text-muted-foreground")}>
                        {g.title}
                      </div>

                      {g.why ? <div className="text-xs text-muted-foreground mt-1 break-words">{g.why}</div> : null}

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        {g.category ? (
                          <span className="px-2 py-0.5 rounded-full border text-muted-foreground">{g.category}</span>
                        ) : null}
                        {g.target ? (
                          <span className="px-2 py-0.5 rounded-full border text-muted-foreground">{g.target}</span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-full border">{isDone ? "Done" : "Active"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => requestGenerateTodos(g.id)}
                        disabled={aiButtonDisabled}
                        title={
                          isDone
                            ? "목표가 달성 되었어요!"
                            : weekQuotaReached
                            ? `이번 주 AI 생성 한도(${MAX_AI_GOALS_PER_WEEK})를 다 썼어`
                            : "AI가 할 일 정리해줘요"
                        }
                      >
                        {aiPending
                          ? "AI가 생성 중..."
                          : aiReady
                          ? "AI 생성 완료"
                          : weekQuotaReached
                          ? "이번 주 한도 초과"
                          : "AI가 할 일 정리해줘요"}
                      </Button>

                      {aiReady ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => navigate(`/to-do-lists?goalId=${encodeURIComponent(g.id)}`)}
                        >
                          To-do로 이동
                        </Button>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => requestDeleteGoal(g.id)}
                      disabled={isDeleting}
                    >
                      삭제
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground">Created: {new Date(g.createdAt).toLocaleString()}</div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}