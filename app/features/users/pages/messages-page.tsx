import * as React from "react";
import { MessageCircleIcon } from "lucide-react";
import type { Route } from "./+types/messages-page";
import { Card } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { useNavigate } from "react-router";

export const meta: Route.MetaFunction = () => [{ title: "Messages | AI To-Do List" }];

export default function MessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full bg-background">
      <div className="mx-auto flex h-full max-w-xl items-center justify-center px-4">
        <Card className="w-full rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <MessageCircleIcon className="h-7 w-7 text-muted-foreground" />
          </div>

          <h1 className="mt-4 text-base font-semibold">Select a conversation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a room from the list to view messages.
          </p>

          <div className="mt-5 flex justify-center">
            <Button variant="secondary" onClick={() => navigate("/my/messages")}>
              Go to list
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}