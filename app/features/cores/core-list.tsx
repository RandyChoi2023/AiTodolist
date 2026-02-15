import * as React from "react";
import { data, redirect, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/core-list";

import { makeSSRClient } from "~/supa-client";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";

import { Search, Sparkles, TrendingUp, Layers } from "lucide-react";
import { cn } from "~/lib/utils";

type Difficulty = "easy" | "normal" | "hard" | "unknown";
type Status = "active" | "archived";

type CoreListRow = {
  id: string;
  title: string;
  difficulty?: Difficulty | null;
  status?: Status | null;
  created_at: string;
  // 선택: weekly source 등
  source_weekly_todo_id?: string | null;
};

export const meta: Route.MetaFunction = () => [{ title: "My Core List" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  // ✅ core_lists에서 difficulty/status가 없다면 select에서 제거하고 아래 UI는 unknown 처리 가능
  const { data: corelist, error } = await client
    .from("core_lists")
    .select("id,title,difficulty,status,created_at,source_weekly_todo_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data({ corelist: (corelist ?? []) as CoreListRow[] }, { headers });
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function difficultyMeta(d: Difficulty) {
  switch (d) {
    case "easy":
      return {
        label: "Easy",
        pill: "bg-yellow-100 text-yellow-900 border-yellow-200",
        card: "border-yellow-200/70 bg-yellow-50/30",
        desc: "Small wins & warm-up habits",
      };
    case "normal":
      return {
        label: "Normal",
        pill: "bg-sky-100 text-sky-900 border-sky-200",
        card: "border-sky-200/70 bg-sky-50/30",
        desc: "Consistency & growth habits",
      };
    case "hard":
      return {
        label: "Hard",
        pill: "bg-orange-100 text-orange-900 border-orange-200",
        card: "border-orange-200/70 bg-orange-50/30",
        desc: "Expert-level identity habits",
      };
    default:
      return {
        label: "Unknown",
        pill: "bg-muted text-muted-foreground border-border",
        card: "border-border bg-background",
        desc: "Uncategorized",
      };
  }
}

function statusMeta(s: Status) {
  return s === "archived"
    ? { label: "Archived", pill: "bg-muted text-muted-foreground border-border" }
    : { label: "Active", pill: "bg-foreground text-background border-foreground" };
}

function calcDistribution(list: CoreListRow[]) {
  const dist = { easy: 0, normal: 0, hard: 0, unknown: 0 };
  for (const x of list) {
    const d = (x.difficulty ?? "unknown") as Difficulty;
    dist[d] += 1;
  }
  return dist;
}

export default function CoreListAllPage() {
  const { corelist } = useLoaderData<typeof loader>();

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | Status>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<
    "all" | Difficulty
  >("all");
  const [sortKey, setSortKey] = React.useState<
    "created_desc" | "created_asc" | "title_asc"
  >("created_desc");

  const dist = React.useMemo(() => calcDistribution(corelist), [corelist]);
  const total = corelist.length;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = corelist.filter((c) => {
      const d = (c.difficulty ?? "unknown") as Difficulty;
      const s = (c.status ?? "active") as Status;

      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (difficultyFilter !== "all" && d !== difficultyFilter) return false;

      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });

    if (sortKey === "created_desc") {
      list = list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    } else if (sortKey === "created_asc") {
      list = list.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    } else {
      list = list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [corelist, query, statusFilter, difficultyFilter, sortKey]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-14 border-b px-6 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">My core list</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            All Lists · {total} total
          </span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 w-[360px]">
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search core habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* (다음 단계) Easy/Normal/Hard 페이지 링크 */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
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

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search core habits..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Layers className="size-4" />
                Total Core Habits
              </div>
              <Badge variant="outline">{total}</Badge>
            </div>
            <div className="mt-3 text-2xl font-semibold">{total}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Overview of your validated habits.
            </div>
          </div>

          <div className={cn("border rounded-2xl p-4", "bg-muted/20")}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="size-4" />
                Distribution
              </div>
              <Badge variant="outline">Easy/Normal/Hard</Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
                const meta = difficultyMeta(d);
                return (
                  <div key={d} className={cn("rounded-xl border p-3", meta.card)}>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                    <div className="text-lg font-semibold">{dist[d]}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Build a balance of small wins and expert identity habits.
            </div>
          </div>

          <div className="border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="size-4" />
                Suggested next
              </div>
              <Badge variant="outline">Insight</Badge>
            </div>

            {/* 아주 가벼운 인사이트(임시): 분포 기반 */}
            <div className="mt-3 text-sm">
              {dist.hard === 0 ? (
                <div className="font-medium">
                  Add your first <span className="underline">Hard</span> habit.
                </div>
              ) : dist.easy === 0 ? (
                <div className="font-medium">
                  Keep an <span className="underline">Easy</span> habit for recovery days.
                </div>
              ) : (
                <div className="font-medium">
                  Nice balance. Keep your weekly streak alive.
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              (Next step) we’ll compute success-rate & streak per difficulty.
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Filters row */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={(v) => setDifficultyFilter(v as any)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Sort: Newest</SelectItem>
              <SelectItem value="created_asc">Sort: Oldest</SelectItem>
              <SelectItem value="title_asc">Sort: Title A→Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        {/* List */}
        <div className="grid gap-2">
          {filtered.length === 0 ? (
            <div className="border rounded-xl p-10 text-center text-muted-foreground">
              No core habits found.
            </div>
          ) : (
            filtered.map((c) => {
              const d = (c.difficulty ?? "unknown") as Difficulty;
              const s = (c.status ?? "active") as Status;
              const dMeta = difficultyMeta(d);
              const sMeta = statusMeta(s);

              return (
                <div
                  key={c.id}
                  className="border rounded-xl px-4 py-4 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold break-words">{c.title}</div>

                      <span className={cn("px-2 py-0.5 rounded-full text-xs border", dMeta.pill)}>
                        {dMeta.label}
                      </span>

                      <span className={cn("px-2 py-0.5 rounded-full text-xs border", sMeta.pill)}>
                        {sMeta.label}
                      </span>

                      {c.source_weekly_todo_id ? (
                        <Badge variant="outline">From Weekly</Badge>
                      ) : null}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {dMeta.desc} · Created {formatDate(c.created_at)}
                    </div>
                  </div>

                  {/* 액션 없음: 리뷰 페이지니까 View만 */}
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/my-core-list/${c.id}/history`}>View history</Link>
                    </Button>
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
