import * as React from "react";
import type { Route } from "./+types/message-page";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Form, useOutletContext } from "react-router";
import { Textarea } from "~/common/components/ui/textarea";
import { Button } from "~/common/components/ui/button";
import { SendIcon } from "lucide-react";
import { makeSSRClient } from "~/supa-client";
import {
  getLoggedInUserId,
  getMessagesByMessagesRoomId,
  getRoomsParticipant,
  sendMessageToRoom,
} from "../queries";
import { MessageBubble } from "./message-bubble";
import { Card } from "~/common/components/ui/card";
import { cn } from "~/lib/utils";
import { messageRooms } from "../schema";

export const meta: Route.MetaFunction = () => [{ title: "Message | AI To-Do List" }];

function timeAgo(input?: string | null) {
  if (!input) return "No messages yet";

  const dt = new Date(input);
  const diffMs = Date.now() - dt.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const messages = await getMessagesByMessagesRoomId(client, {
    messageRoomId: Number(params.messageRoomId),
    userId,
  });

  const participants = await getRoomsParticipant(client, {
    messageRoomId: Number(params.messageRoomId),
    userId,
  });

  console.log(params.messageRoomId);
  console.log(userId);
  console.log(participants);
  const lastMessageAt =
    messages.length > 0 ? (messages[messages.length - 1] as any).created_at : null;

  return { messages, participants, lastMessageAt };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const formData = await request.formData();
  const message = formData.get("message");

  await sendMessageToRoom(client, {
    messageRoomId: Number(params.messageRoomId),
    message: message as string,
    userId,
  });

  return { ok: true };
};

export default function MessagePage({ loaderData, actionData }: Route.ComponentProps) {
  const { userId } = useOutletContext<{ userId: string }>();

  const formRef = React.useRef<HTMLFormElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const lastText = React.useMemo(
    () => timeAgo(loaderData.lastMessageAt),
    [loaderData.lastMessageAt]
  );

  // 전송 성공 시 입력창 리셋 + 아래로 스크롤
  React.useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }, [actionData]);

  // 메시지 갯수 변하면 아래로 스크롤
  React.useEffect(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
  }, [loaderData.messages.length]);

  const otherName = loaderData.participants?.profile?.name ?? "";
  const otherAvatar = loaderData.participants?.profile?.avatar ?? "";
  const otherInitial = otherName?.charAt(0) ?? "";

  return (
    // ✅ iOS 키보드/주소창 대응: 100dvh
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-3 py-3 md:px-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherAvatar || undefined} />
            <AvatarFallback>{otherInitial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{otherName}</p>
            <p className="truncate text-xs text-muted-foreground">{lastText}</p>
          </div>
        </div>
      </div>

      {/* ✅ Messages scroll area (여기가 핵심) */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto", // ✅ min-h-0 필수!
          "px-3 py-4 md:px-4 md:py-5"
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {loaderData.messages.map((message) => (
            <MessageBubble
              key={message.message_id}
              avatarUrl={message.sender?.avatar ?? ""}
              avatarFallback={message.sender?.name?.charAt(0) ?? ""}
              content={message.content}
              isCurrentUser={message.sender?.profile_id === userId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ✅ Composer (sticky 제거하고, flex 구조로 “아래 고정”이 제일 안전함) */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {/* ✅ iPhone safe-area */}
        <div className="pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-4">
            <Card className="rounded-2xl border shadow-sm">
              <div className="p-3">
                <Form ref={formRef} method="post" className="relative">
                  <Textarea
                    placeholder="Write a message..."
                    rows={2}
                    className="min-h-[44px] resize-none rounded-2xl pr-12"
                    required
                    name="message"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-2 h-9 w-9 rounded-xl"
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Tip: <span className="font-medium">Cmd/Ctrl + Enter</span> to send
                  </p>
                </Form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}