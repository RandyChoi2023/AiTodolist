import { data, redirect, useLoaderData, Link } from "react-router";
import type { Route } from "./+types/core-history";

import { makeSSRClient } from "~/supa-client";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";

import { getWeeklyHistoryByCore } from "./queries";

export const meta: Route.MetaFunction = () => [
  { title: "Core Habit History" },
];

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client, headers } = makeSSRClient(request);

  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return redirect("/auth/login", { headers });

  const coreListId = params.id;
  if (!coreListId) {
    throw new Response("Core list not found", { status: 404 });
  }

  const history = await getWeeklyHistoryByCore(client, {
    userId: user.id,
    coreListId,
  });

  return data({ history }, { headers });
};

function countChecks(checks: boolean[]) {
  return checks.filter(Boolean).length;
}

function isSuccessful(checks: boolean[]) {
  return countChecks(checks) >= 5; // ⭐ Core 조건
}

export default function CoreHistoryPage() {
  const { history } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-14 border-b px-6 flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link to="/my-core-list">← Back</Link>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <span className="text-lg font-semibold">Core Habit History</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {history.length === 0 ? (
          <div className="border rounded-lg p-10 text-center text-muted-foreground">
            아직 이 Core List에 대한 히스토리가 없어.
          </div>
        ) : (
          <div className="grid gap-3">
            {history.map((w) => {
              const checked = countChecks(w.checks);
              const success = isSuccessful(w.checks);

              return (
                <div
                  key={w.id}
                  className="border rounded-xl px-4 py-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {w.period_start} ~ {w.period_end}
                    </div>

                    <Badge
                      variant={success ? "default" : "secondary"}
                      className={!success ? "text-muted-foreground" : ""}
                    >
                      {success ? "SUCCESS" : "FAILED"}
                    </Badge>
                  </div>

                  {/* 체크 시각화 */}
                  <div className="flex gap-2">
                    {w.checks.map((c, idx) => (
                      <div
                        key={idx}
                        className={`size-4 rounded-full ${
                          c ? "bg-green-500" : "bg-muted"
                        }`}
                        title={`Day ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {checked} / 7 days completed
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
