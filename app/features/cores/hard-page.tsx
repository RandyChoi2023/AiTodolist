import * as React from "react";
import { data, redirect, useFetcher, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/hard-page";

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

import {
  Shield,
  Crown,
  Search,
  ArrowRight,
  Flame,
  LockKeyhole,
} from "lucide-react";

/**
 * ✅ Hard page = Expert / Identity Zone (오렌지 톤: 집중/에너지/전문가)
 *
 * 정책(추천):
 * - Hard에서는 "수동 추가" 금지 (오직 승격만)
 * - Delete는 강한 경고
 *
 * 전제:
 * - core_lists: user_id, title, difficulty('hard'), status('active'|'archived'), created_at, source_weekly_todo_id
 */

type Status = "active" | "archived";

type CoreListRow = {
  id: string;
  title: string;
  difficulty: "hard";
  status?: Status | null;
  created_at: string;
  source_weekly_todo_id?: string | null;
};

export const meta: Route.MetaFunction = () => [{ title: "Hard Core List" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const { data: corelist, error } = await client
    .from("core_lists")
    .select("id,title,difficulty,status,created_at,source_weekly_todo_id")
    .eq("user_id", user.id)
    .eq("difficulty", "hard")
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

export default function HardCoreListPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 text-orange-950">
      {/* Header */}
      <header className="h-14 border-b border-orange-200 bg-orange-50/80 backdrop-blur px-6 flex items-center gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">My core list</span>
          <Separator orientation="vertical" className="h-6 bg-orange-200" />
          <span className="text-sm text-orange-700">Hard · {activeCount} active</span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 w-[360px]">
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-700" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hard habits..."
              className="pl-9 bg-white border-orange-200 text-orange-950 placeholder:text-orange-400"
            />
          </div>
        </div>

        {/* nav */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild className="text-orange-900 hover:text-orange-950">
            <Link to="/my-core-list/all-lists">All</Link>
          </Button>
          <Button variant="ghost" asChild className="text-orange-900 hover:text-orange-950">
            <Link to="/my-core-list/easy">Easy</Link>
          </Button>
          <Button variant="ghost" asChild className="text-orange-900 hover:text-orange-950">
            <Link to="/my-core-list/normal">Normal</Link>
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild>
            <Link to="/my-core-list/hard">Hard</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-700" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hard habits..."
              className="pl-9 bg-white border-orange-200 text-orange-950 placeholder:text-orange-400"
            />
          </div>
        </div>

        {/* Hero */}
        <div className="border border-orange-300 rounded-2xl p-6 bg-gradient-to-br from-orange-100 to-amber-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-600 text-white">
                  <Crown className="size-4 mr-1" />
                  Hard
                </Badge>
                <span className="text-sm text-orange-800">
                  Expert zone · 협상 없는 습관
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                No negotiation. Only execution.
              </h1>

              <p className="mt-2 text-sm text-orange-800 max-w-[70ch]">
                Hard는 “전문가 습관”만 존재하는 공간이야. (추천) 수동 추가는 금지하고,
                Weekly에서 충분히 검증된 습관만 승격시켜서 들어오게 해.
              </p>

              <div className="mt-4 flex items-center gap-3 text-xs text-orange-700">
                <Shield className="size-4 text-orange-600" />
                <span>History is evidence — not a diary.</span>
                <span className="opacity-60">•</span>
                <Flame className="size-4 text-orange-600" />
                <span>Streak matters.</span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2">
              <Button variant="secondary" asChild className="gap-2 bg-white hover:bg-orange-50">
                <Link to="/to-do-lists">
                  Go to weekly checklist <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <LockKeyhole className="size-4 text-orange-600" />
                <span>Hard is earned, not added.</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-orange-200" />

        {/* List */}
        <div className="grid gap-2">
          {filtered.length === 0 ? (
            <div className="border border-orange-200 rounded-xl p-10 text-center text-orange-700 bg-white">
              No hard habits yet. <br />
              Weekly checklist에서 “5/7 성공”을 꾸준히 만들고 승격해봐.
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
                    "border border-orange-200 rounded-2xl px-4 py-4 flex items-start gap-3 bg-white",
                    status === "archived" && "opacity-60"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold break-words">{c.title}</div>

                      <span className="px-2 py-0.5 rounded-full text-xs border border-orange-400 bg-orange-100 text-orange-800">
                        Hard
                      </span>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs border",
                          status === "active"
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-orange-100 text-orange-700 border-orange-200"
                        )}
                      >
                        {status === "active" ? "Active" : "Archived"}
                      </span>

                      {c.source_weekly_todo_id ? (
                        <Badge variant="outline" className="border-orange-200 text-orange-800">
                          From Weekly
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-200 text-orange-800">
                          Manual
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-orange-700">
                      Created {formatDate(c.created_at)}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        asChild
                      >
                        <Link to={`/my-core-list/${c.id}/history`}>View history</Link>
                      </Button>

                      {status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-orange-900 hover:text-orange-950"
                          onClick={() =>
                            archiveFetcher.submit(
                              { intent: "archive", id: c.id },
                              { method: "post" }
                            )
                          }
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-orange-900 hover:text-orange-950"
                          onClick={() =>
                            archiveFetcher.submit(
                              { intent: "unarchive", id: c.id },
                              { method: "post" }
                            )
                          }
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Restoring..." : "Unarchive"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delete (강한 경고) */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="bg-white border-orange-200 text-orange-950">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-orange-950">
                          Delete this Hard habit?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-orange-800">
                          Hard는 “정체성 습관”이야. 삭제하면 히스토리와 증거가 끊길 수 있어.
                          <br />
                          정말 삭제할까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white border-orange-200 hover:bg-orange-50">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() =>
                            deleteFetcher.submit(
                              { intent: "delete", id: c.id },
                              { method: "post" }
                            )
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
          <p className="mt-4 text-sm text-red-600">{(archiveFetcher.data as any)?.message}</p>
        ) : null}
        {"data" in deleteFetcher && (deleteFetcher.data as any)?.ok === false ? (
          <p className="mt-2 text-sm text-red-600">{(deleteFetcher.data as any)?.message}</p>
        ) : null}
      </main>
    </div>
  );
}
