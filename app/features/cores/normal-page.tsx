import * as React from "react";
import { data, redirect, useFetcher, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/normal-page";

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

import { Search, Sparkles, ArrowRight } from "lucide-react";

/**
 * ✅ Normal page = Main Action Zone (꾸준함 / 성장 / "기본기")
 *
 * 정책(추천):
 * - Normal에서는 "수동 추가"는 막고(=검증된 습관만), 승격(weekly→core)로만 들어오게 하는 걸 추천.
 *   → 그래서 이 페이지는 "실행 + 유지" 중심 (Archive/Unarchive/Delete만 제공)
 *
 * 전제:
 * - core_lists 테이블: user_id, title, difficulty('normal'), status('active'|'archived'), created_at, source_weekly_todo_id
 */

type Status = "active" | "archived";

type CoreListRow = {
  id: string;
  title: string;
  difficulty: "normal";
  status?: Status | null;
  created_at: string;
  source_weekly_todo_id?: string | null;
};

export const meta: Route.MetaFunction = () => [{ title: "Normal Core List" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const { data: corelist, error } = await client
    .from("core_lists")
    .select("id,title,difficulty,status,created_at,source_weekly_todo_id")
    .eq("user_id", user.id)
    .eq("difficulty", "normal")
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
  const id = String(fd.get("id") ?? "");

  try {
    if (!id) return data({ ok: false, message: "Missing id" }, { headers, status: 400 });

    if (intent === "archive") {
      const { error } = await client
        .from("core_lists")
        .update({ status: "archived" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    if (intent === "unarchive") {
      const { error } = await client
        .from("core_lists")
        .update({ status: "active" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return data({ ok: true }, { headers });
    }

    if (intent === "delete") {
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

export default function NormalCoreListPage() {
  const { corelist } = useLoaderData<typeof loader>();

  const archiveFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [query, setQuery] = React.useState("");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-indigo-50">
      {/* Header */}
      <header className="h-14 border-b bg-background/70 backdrop-blur px-6 flex items-center gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">My core list</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">Normal · {activeCount} active</span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 w-[360px]">
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search normal habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* nav */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/my-core-list/all-lists">All</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/my-core-list/easy">Easy</Link>
          </Button>
          <Button variant="secondary" asChild>
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
              placeholder="Search normal habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Hero */}
        <div className="border rounded-2xl p-5 bg-background/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-sky-200 text-sky-900">Normal</Badge>
                <span className="text-sm text-muted-foreground">
                  메인 액션 존 · 꾸준함이 실력을 만든다
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold">
                Stay consistent. Level up.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Normal은 “검증된 습관”을 유지하는 공간이야. (추천) 여기서는 수동 추가보다
                Weekly 성공 → 승격으로 들어오게 해.
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-4 text-sky-500" />
                <span>Focus on streaks & momentum</span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2">
              <Button variant="secondary" asChild className="gap-2">
                <Link to="/to-do-lists">
                  Go to weekly checklist <ArrowRight className="size-4" />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                Weekly에서 성공하면 Normal로 승격
              </span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* List */}
        <div className="grid gap-2">
          {filtered.length === 0 ? (
            <div className="border rounded-xl p-10 text-center text-muted-foreground bg-background/70">
              No normal habits yet. <br />
              Weekly checklist에서 성공을 쌓아 승격해봐!
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

                      <span className="px-2 py-0.5 rounded-full text-xs border bg-sky-100 text-sky-900 border-sky-200">
                        Normal
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
                        <AlertDialogTitle>Delete this Normal habit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Normal은 “검증된 습관”이야. 삭제하면 기록이 끊길 수 있어.
                          <br />
                          정말 삭제할까?
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
