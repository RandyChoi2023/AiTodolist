import * as React from "react";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Checkbox } from "~/common/components/ui/checkbox";
import { Separator } from "~/common/components/ui/separator";
import { cn } from "~/lib/utils";
import { v4 as uuidv4 } from "uuid";

type GoalStatus = "active" | "done";

type Goal = {
  id: string;
  title: string;
  why: string;
  category?: string; // 예: English, Fitness, Career, etc (선택)
  target?: string;   // 예: "Speak 100 sentences daily" (선택)
  status: GoalStatus;
  createdAt: number;
};

const MAX_ACTIVE_GOALS = 2; // ✅ 2개 추천 (원하면 3으로 바꾸면 됨)

export default function GoalsListPage() {
  const [title, setTitle] = React.useState("");
  const [why, setWhy] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const [goals, setGoals] = React.useState<Goal[]>([
    {
      id: uuidv4(),
      title: "영어 공부 하기",
      why: "열심히 해서 영어 잘하는 개발자가 되고 싶다. ",
      category: "영어",
      target: "개발 관련 내용 영어로 이해하기",
      status: "active",
      createdAt: Date.now() - 2000,
    },
    {
      id: uuidv4(),
      title: "1인 개발자 되기",
      why: "평생 개발하고 싶어서",
      category: "프로그래밍",
      target: "포트폴리오 만들기",
      status: "done",
      createdAt: Date.now() - 1000,
    },
  ]);

  const [hideDone, setHideDone] = React.useState(false);

  const activeCount = React.useMemo(
    () => goals.filter((g) => g.status === "active").length,
    [goals]
  );

  const visibleGoals = React.useMemo(() => {
    const list = hideDone ? goals.filter((g) => g.status !== "done") : goals;
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [goals, hideDone]);

  function setErrorTemp(message: string) {
    setError(message);
    window.setTimeout(() => setError(null), 2500);
  }

  function addGoal() {
    const t = title.trim();
    const w = why.trim();

    if (!t) return;

    // ✅ Active 목표 개수 제한
    if (activeCount >= MAX_ACTIVE_GOALS) {
      setErrorTemp(`설정 할 수 있는 목표는 최대 ${MAX_ACTIVE_GOALS}개까지만 가능합니다.`);
      return;
    }

    setGoals((prev) => [
      {
        id: uuidv4(),
        title: t,
        why: w,
        category: category.trim() || undefined,
        target: target.trim() || undefined,
        status: "active",
        createdAt: Date.now(),
      },
      ...prev,
    ]);

    setTitle("");
    setWhy("");
    setCategory("");
    setTarget("");
  }

  function toggleDone(id: string) {
    setGoals((prev) => {
      const targetGoal = prev.find((g) => g.id === id);
      if (!targetGoal) return prev;

      // done -> active 로 되돌릴 때도 제한 체크
      if (targetGoal.status === "done" && activeCount >= MAX_ACTIVE_GOALS) {
        setErrorTemp(`최대 설정 할 수 있는 목표가 ${MAX_ACTIVE_GOALS} 입니다.`);
        return prev;
      }

      return prev.map((g) =>
        g.id === id
          ? { ...g, status: g.status === "done" ? "active" : "done" }
          : g
      );
    });
  }

  function remove(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function clearDone() {
    setGoals((prev) => prev.filter((g) => g.status !== "done"));
  }

  function openRecommendedTodos(goalId: string) {
    console.log("Open recommended todos for goal:", goalId);
  }

  const total = goals.length;
  const doneCount = goals.filter((g) => g.status === "done").length;

  return (
    <div className="min-h-screen">
      {/* iPhone 느낌: 심플 헤더 */}
      <header className="border-b">
        <div className="h-14 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="font-semibold">Goals</div>
          <div className="text-xs text-muted-foreground">
            Active {activeCount}/{MAX_ACTIVE_GOALS} · Done {doneCount}/{total}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {/* Add Goal */}
        <div className="grid gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이번에 꼭 이루고 싶은 목표는 뭐야?"
            onKeyDown={(e) => {
              if (e.key === "Enter") addGoal();
            }}
          />
          <Input
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="이 목표가 너한테 중요한 이유는 뭐야? (선택)"
          />
          <div className="flex gap-2">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="어떤 분야 목표야? 예: 영어/운동/커리어 (선택)"
            />
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="성공 기준을 한 줄로 적어줘 (선택)"
            />
          </div>

          {/* ✅ 에러 메시지 */}
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}

          <Button onClick={addGoal} disabled={!title.trim() || activeCount >= MAX_ACTIVE_GOALS}>
            목표 추가하기
          </Button>

          {activeCount >= MAX_ACTIVE_GOALS ? (
            <div className="text-xs text-muted-foreground">
              목표는 최대 {MAX_ACTIVE_GOALS}개까지. 다른 목표를 완료하면 추가할수 있습니다.
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setHideDone((v) => !v)}
          >
            {hideDone ? "완료 목표 보기" : "완료 목표 숨기기"}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearDone}
            disabled={doneCount === 0}
          >
            완료 목표 삭제
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Goals List */}
        <div className="grid gap-2">
          {visibleGoals.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              아직 목표가 없어 🎯
            </div>
          ) : (
            visibleGoals.map((g) => {
              const isDone = g.status === "done";

              return (
                <div
                  key={g.id}
                  className={cn(
                    "border rounded-xl px-3 py-3 grid gap-2",
                    isDone && "opacity-70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Done 체크: 사용자가 목표 완료처리 */}
                    <Checkbox checked={isDone} onCheckedChange={() => toggleDone(g.id)} />

                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-medium text-sm wrap-break-word",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {g.title}
                      </div>

                      {g.why ? (
                        <div className="text-xs text-muted-foreground mt-1 wrap-break-word">
                          {g.why}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        {g.category ? (
                          <span className="px-2 py-0.5 rounded-full border text-muted-foreground">
                            {g.category}
                          </span>
                        ) : null}
                        {g.target ? (
                          <span className="px-2 py-0.5 rounded-full border text-muted-foreground">
                            {g.target}
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-full border">
                          {isDone ? "Done" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 액션: 여기서는 오직 "추천 Todo로 이동"만 */}
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openRecommendedTodos(g.id)}
                      disabled={isDone}
                      title={isDone ? "목표가 달성 되었어요!" : "AI가 할 일 정리해줘요"}
                    >
                      AI가 할 일 정리해줘요
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => remove(g.id)}>
                      삭제
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    Created: {new Date(g.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
