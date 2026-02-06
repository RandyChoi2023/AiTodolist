import * as React from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from "lucide-react";

import { v4 as uuidv4 } from "uuid";

import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Badge } from "~/common/components/ui/badge";
import { Checkbox } from "~/common/components/ui/checkbox";
import { Separator } from "~/common/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

import { getCoreList } from "./queries";
import { useLoaderData } from "react-router";


type Priority = "low" | "medium" | "high";
type StatusFilter = "all" | "active" | "done";
type SortKey = "created" | "due" | "priority";

type Task = {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  priority: Priority;
  due?: string; // yyyy-mm-dd
  createdAt: Date;
};

import type { Route } from "./+types/core-list";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "../users/queries";

const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};


function priorityBadgeColor(p: Priority) {
  // shadcn Badge는 기본 variant만 있지만 class로 충분히 표현 가능

  switch (p) {
    case "high":
      return "text-red-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-green-500";
  }

  
}
export const loader = async ({ request }: Route.LoaderArgs) => {

  const { client, headers } = makeSSRClient(request);
  await getLoggedInUserId(client);

  const corelist = await getCoreList(client, { userId: '0dbe3274-d439-4926-8c31-f59aa1df27e6' });
  return { corelist };
};

export default function CoreListPage() {
  const { corelist } = useLoaderData<typeof loader>();

  const [items, setItems] = React.useState<Task[]>(
    () =>
      (corelist ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        done: t.done,
        priority: t.prority,
        due: t.due,
        createdAt: t.created_at,
      }))
  );
  

  // const [tasks, setTasks] = React.useState<Task[]>([
  //   {
  //     id: uuidv4(),
  //     title: "영어단어 10개 외우기",
  //     notes: "10개 외운것 12시간 지난 다음 써서 완료햐기",
  //     done: false,
  //     priority: "low",
  //     due: new Date().toISOString().slice(0, 10),
  //     createdAt: Date.now() - 100000,
  //   },
  //   {
  //     id: uuidv4(),
  //     title: "네플릭스 자막없이 시청하기 10분",
  //     notes: "10분동안 시청 내용중에 한 문장 써서 기록하고 완료!",
  //     done: false,
  //     priority: "medium",
  //     createdAt: Date.now() - 50000,
  //   },
  //   {
  //     id: uuidv4(),
  //     title: "영어 선생님하고 렌덤 체팅하기",
  //     notes: "체팅 후 기억나는 문장 써보기",
  //     done: true,
  //     priority: "high",
  //     createdAt: Date.now() - 20000,
  //   },
  // ]);

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<Priority | "all">(
    "all"
  );
  const [sortKey, setSortKey] = React.useState<SortKey>("created");

  // new task dialog state
  const [open, setOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newNotes, setNewNotes] = React.useState("");
  const [newPriority, setNewPriority] = React.useState<Priority>("medium");
  const [newDue, setNewDue] = React.useState<string>("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = corelist.filter((t) => {
      if (statusFilter === "active" && t.done) return false;
      if (statusFilter === "done" && !t.done) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;

      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q)
      );
    });

    list = list.sort((a, b) => {
      if (sortKey === "created") return Date.parse(b.created_at) - Date.parse(a.created_at);
      if (sortKey === "due") {
        const ad = a.due ? Date.parse(a.due) : Number.POSITIVE_INFINITY;
        const bd = b.due ? Date.parse(b.due) : Number.POSITIVE_INFINITY;
        return ad - bd;
      }
      // priority: high first
      const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    });

    return list;
  }, [corelist, query, statusFilter, priorityFilter, sortKey]);

  function toggleDone(id: string) {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function removeTask(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;

    const task: Task = {
      id: uuidv4(),
      title,
      notes: newNotes.trim() ? newNotes.trim() : undefined,
      done: false,
      priority: newPriority,
      due: newDue || undefined,
      createdAt: new Date(),
    };

    setItems((prev) => [task, ...prev]);
    setNewTitle("");
    setNewNotes("");
    setNewPriority("medium");
    setNewDue("");
    setOpen(false);
  }

  const doneCount = corelist.filter((t) => t.done).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-14 border-b px-6 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">AI Todo List</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            {doneCount}/{corelist.length} done
          </span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 w-[360px]">
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9"
            />
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create a new task</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Finish resume"
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newPriority}
                    onValueChange={(v) => setNewPriority(v as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Due date</label>
                  <div className="relative">
                    <CalendarIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={newDue}
                      onChange={(e) => setNewDue(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTask}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Mobile search */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as Priority | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Sort: Created</SelectItem>
                <SelectItem value="due">Sort: Due date</SelectItem>
                <SelectItem value="priority">Sort: Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-5" />

        {/* List */}
        <div className="grid gap-2">
          {filtered.length === 0 ? (
            <div className="border rounded-lg p-10 text-center text-muted-foreground">
              No tasks found.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="border rounded-lg px-4 py-3 flex items-start gap-3"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() => toggleDone(t.id)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium ${
                        t.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </span>

                    <Badge className={priorityBadgeColor(t.priority)}>
                      {priorityLabel[t.priority]}
                    </Badge>

                    {t.due && (
                      <span className="text-xs text-muted-foreground">
                        Due: {t.due}
                      </span>
                    )}
                  </div>

                  {t.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {t.notes}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* 나중에 Edit 연결 */}
                    <DropdownMenuItem onClick={() => removeTask(t.id)}>
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
