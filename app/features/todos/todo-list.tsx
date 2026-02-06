import * as React from "react";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Checkbox } from "~/common/components/ui/checkbox";
import { Separator } from "~/common/components/ui/separator";
import { cn } from "~/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { getTodoList } from "./queries";
import { useLoaderData, data } from "react-router";
import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/todo-list";



type Item = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};


export const loader = async ({ request }: Route.LoaderArgs) => {
  // await new Promise((resolve) => setTimeout(resolve,5000));
  // const [todos, more] = await Promise.all([getTodoList('0dbe3274-d439-4926-8c31-f59aa1df27e6'),more]);

  const { client, headers } = makeSSRClient(request);


  const todos = await getTodoList( client, {userId: '0dbe3274-d439-4926-8c31-f59aa1df27e6'});

  return data({ todos }, { headers });
};



export default function TodoPage() {
  const { todos } = useLoaderData<typeof loader>();
  const [text, setText] = React.useState("");
  const [items, setItems] = React.useState<Item[]>(
    () =>
      (todos ?? []).map((t: any) => ({
        id: String(t.id),                 // DB id가 uuid면 그대로
        text: String(t.text ?? t.title),  // 컬럼명 맞춰줘
        done: Boolean(t.done),
        createdAt: Number(t.createdAt ?? Date.now()),
      }))
  );
  const [hideDone, setHideDone] = React.useState(false);

  const visibleItems = React.useMemo(() => {
    const list = hideDone ? items.filter((i) => !i.done) : items;
    // 최신이 위로
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [items, hideDone]);

  function addItem() {
    const v = text.trim();
    if (!v) return;

    setItems((prev) => [
      { id: uuidv4(), text: v, done: false, createdAt: Date.now() },
      ...prev, 
    ]);
    setText("");
  }

  function toggle(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="min-h-screen">
      {/* iPhone 느낌: 심플 헤더 */}
      <header className="border-b">
        <div className="h-14 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="font-semibold">To-Do</div>
          <div className="text-xs text-muted-foreground">
            {doneCount}/{total}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {/* Quick Add */}
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="할 수 있는 To-do를 작성해주세요."
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
            }}
          />
          <Button onClick={addItem} disabled={!text.trim()}>
            추가
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setHideDone((v) => !v)}
          >
            {hideDone ? "완료 된 목록 보기" : "숨기기"}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearDone}
            disabled={doneCount === 0}
          >
            완료된 목록 삭제
          </Button>
        </div>

        <Separator className="my-4" />

        {/* List */}
        <div className="grid gap-2">
          {visibleItems.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              Nothing here 🎉
            </div>
          ) : (
            visibleItems.map((i) => (
              <div
                key={i.id}
                className="border rounded-xl px-3 py-3 flex items-center gap-3"
              >
                <Checkbox
                  checked={i.done}
                  onCheckedChange={() => toggle(i.id)}
                />

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm break-words",
                      i.done && "line-through text-muted-foreground"
                    )}
                  >
                    {i.text}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(i.id)}
                >
                  삭제
                </Button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
