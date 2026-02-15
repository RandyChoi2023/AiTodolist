import * as React from "react";
import { data, redirect, useFetcher, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/easy-page";

import { makeSSRClient } from "~/supa-client";
import { cn } from "~/lib/utils";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";

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

import { Search, Plus, Sparkles } from "lucide-react";

/**
 * ✅ Easy page = Action Zone (가볍게, 부담 없이, "오늘도 출석")
 *
 * 전제:
 * - core_lists 테이블에: user_id, title, difficulty('easy'), created_at, status('active'|'archived') 가 있다고 가정
 * - (선택) status가 없으면 아래 select/update에서 제거해도 됨
 */

type Status = "active" | "archived";

type CoreListRow = {
  id: string;
  title: string;
  difficulty: "easy";
  status?: Status | null;
  created_at: string;
  source_weekly_todo_id?: string | null;
};

export const meta: Route.MetaFunction = () => [{ title: "Easy Core List" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const { data: corelist, error } = await client
    .from("core_lists")
    .select("id,title,difficulty,status,created_at,source_weekly_todo_id")
    .eq("user_id", user.id)
    .eq("difficulty", "easy")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data({ corelist: (corelist ?? []) as CoreListRow[] }, { headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "");

  try {
    if (intent === "create") {
      const title = String(fd.get("title") ?? "").trim();
      if (!title) return data({ ok: false, message: "Title required" }, { headers, status: 400 });

      const { error } = await client.from("core_lists").insert({
        user_id: user.id,
        title,
        difficulty: "easy",
        status: "active",
      });

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    if (intent === "archive") {
      const id = String(fd.get("id") ?? "");
      const { error } = await client
        .from("core_lists")
        .update({ status: "archived" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    if (intent === "unarchive") {
      const id = String(fd.get("id") ?? "");
      const { error } = await client
        .from("core_lists")
        .update({ status: "active" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    if (intent === "delete") {
      const id = String(fd.get("id") ?? "");
      const { error } = await client
        .from("core_lists")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    return data({ ok: false, message: "Unknown intent" }, { headers, status: 400 });
  } catch (e: any) {
    return data({ ok: false, message: e?.message ?? "Action failed" }, { headers, status: 400 });
  }
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export default function EasyCoreListPage() {
  const { corelist } = useLoaderData<typeof loader>();

  const createFetcher = useFetcher();
  const archiveFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [query, setQuery] = React.useState("");
  const [newTitle, setNewTitle] = React.useState("");

  const creating = createFetcher.state !== "idle";
  const archivingId =
    archiveFetcher.state !== "idle" ? String(archiveFetcher.formData?.get("id") ?? "") : "";
  const deletingId =
    deleteFetcher.state !== "idle" ? String(deleteFetcher.formData?.get("id") ?? "") : "";

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return corelist;
    return corelist.filter((c) => c.title.toLowerCase().includes(q));
  }, [corelist, query]);

  const activeCount = corelist.filter((c) => (c.status ?? "active") === "active").length;

  const submitCreate = () => {
    const title = newTitle.trim();
    if (!title || creating) return;
    createFetcher.submit({ intent: "create", title }, { method: "post" });
    setNewTitle("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-background to-yellow-50">
      {/* Header */}
      <header className="h-14 border-b bg-background/70 backdrop-blur px-6 flex items-center gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">My core list</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">Easy · {activeCount} active</span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 w-[360px]">
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search easy habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* nav */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/my-core-list/all-lists">All</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/my-core-list/easy">Easy</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/my-core-list/normal">Normal</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/my-core-list/hard">Hard</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search easy habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Hero */}
        <div className="border rounded-2xl p-5 bg-background/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-200 text-yellow-900">Easy</Badge>
                <span className="text-sm text-muted-foreground">
                  작은 습관으로 “출석”하는 공간
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold">
                Start small. Show up today.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Easy는 부담 없는 행동을 유지하는 트랙이야. “완벽”보다 “지속”이 목표.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Sparkles className="size-5 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                Recovery-friendly
              </span>
            </div>
          </div>

          {/* Create (Easy에서만 허용: 부담 없이 추가 가능) */}
          <div className="mt-4 flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: 영어 단어 3개 보기"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreate();
              }}
            />
            <Button onClick={submitCreate} disabled={!newTitle.trim() || creating} className="gap-2">
              <Plus className="size-4" />
              {creating ? "Adding..." : "Add"}
            </Button>
          </div>

          {"data" in createFetcher && (createFetcher.data as any)?.ok === false ? (
            <p className="mt-2 text-sm text-red-500">{(createFetcher.data as any)?.message}</p>
          ) : null}
        </div>

        <Separator className="my-6" />

        {/* List */}
        <div className="grid gap-2">
          {filtered.length === 0 ? (
            <div className="border rounded-xl p-10 text-center text-muted-foreground bg-background/70">
              No easy habits yet.
            </div>
          ) : (
            filtered.map((c) => {
              const status = (c.status ?? "active") as Status;
              const isArchiving = archivingId === c.id;
              const isDeleting = deletingId === c.id;

              return (
                <div
                  key={c.id}
                  className={cn(
                    "border rounded-2xl px-4 py-4 flex items-start gap-3 bg-background/70",
                    status === "archived" && "opacity-70"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold break-words">{c.title}</div>

                      <span className="px-2 py-0.5 rounded-full text-xs border bg-yellow-100 text-yellow-900 border-yellow-200">
                        Easy
                      </span>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs border",
                          status === "active"
                            ? "bg-foreground text-background border-foreground"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {status === "active" ? "Active" : "Archived"}
                      </span>

                      {c.source_weekly_todo_id ? (
                        <Badge variant="outline">From Weekly</Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Created {formatDate(c.created_at)}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={`/my-core-list/${c.id}/history`}>View history</Link>
                      </Button>

                      {status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            archiveFetcher.submit({ intent: "archive", id: c.id }, { method: "post" })
                          }
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            archiveFetcher.submit({ intent: "unarchive", id: c.id }, { method: "post" })
                          }
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Restoring..." : "Unarchive"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Easy habit은 삭제해도 괜찮아. 필요하면 다시 만들면 돼.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteFetcher.submit({ intent: "delete", id: c.id }, { method: "post" })
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>

        {"data" in archiveFetcher && (archiveFetcher.data as any)?.ok === false ? (
          <p className="mt-4 text-sm text-red-500">{(archiveFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in deleteFetcher && (deleteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-500">{(deleteFetcher.data as any)?.message}</p>
        ) : null}
      </main>
    </div>
  );
}
