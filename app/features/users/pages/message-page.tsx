import * as React from "react";
import type { Route } from "./+types/message-page";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { useFetcher, useOutletContext } from "react-router";
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

  const messageRoomId = Number(params.messageRoomId);

  const messages = await getMessagesByMessagesRoomId(client, {
    messageRoomId,
    userId,
  });

  const participants = await getRoomsParticipant(client, {
    messageRoomId,
    userId,
  });

  const lastMessageAt =
    messages.length > 0 ? (messages[messages.length - 1] as any).created_at : null;

  return { messages, participants, lastMessageAt };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const messageRoomId = Number(params.messageRoomId);

  const formData = await request.formData();
  const message = String(formData.get("message") ?? "").trim();

  if (!message) {
    return { ok: false, error: "Empty message" };
  }

  await sendMessageToRoom(client, {
    messageRoomId,
    message,
    userId,
  });

  return { ok: true };
};

export default function MessagePage({ loaderData }: Route.ComponentProps) {
  const { userId } = useOutletContext<{ userId: string }>();

  // ✅ fetcher로 전송하면 actionData 의존 없이, 중복 방지/상태 제어가 쉬움
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();

  const bottomRef = React.useRef<HTMLDivElement>(null);

  // ✅ controlled input (중복 submit 방지 + reset 확실)
  const [text, setText] = React.useState("");

  const isSending = fetcher.state !== "idle";

  const lastText = React.useMemo(
    () => timeAgo(loaderData.lastMessageAt),
    [loaderData.lastMessageAt]
  );

  // ✅ 전송 성공 시 입력 초기화 + 아래로 스크롤
  React.useEffect(() => {
    if (fetcher.data?.ok) {
      setText("");
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
  }, [fetcher.data]);

  // ✅ 메시지 갯수 변하면 아래로 스크롤
  React.useEffect(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
  }, [loaderData.messages.length]);

  const otherName = loaderData.participants?.profile?.name ?? "Unknown";
  const otherAvatar = loaderData.participants?.profile?.avatar ?? "";
  const otherInitial = otherName?.charAt(0) ?? "U";

  // ✅ “한 번만” 보내기 함수 (키 반복/연타 방지)
  const submitOnce = React.useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isSending) return;

    const fd = new FormData();
    fd.set("message", trimmed);

    fetcher.submit(fd, { method: "post" });
  }, [text, isSending, fetcher]);

  return (
    // ✅ 부모 layout이 100dvh를 잡는 구조면: h-full이 안전
    <div className="h-full flex flex-col bg-background">
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

      {/* Messages scroll area */}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
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

      {/* Composer */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-4">
            <Card className="rounded-2xl border shadow-sm">
              <div className="p-3">
                {/* ✅ fetcher.Form 사용 가능 (원하면). 
                    여기선 fetcher.submit을 쓰고 있으니 일반 div로 둬도 OK. */}
                <div className="relative">
                  <Textarea
                    placeholder="Write a message..."
                    rows={2}
                    className="min-h-[44px] resize-none rounded-2xl pr-12"
                    name="message"
                    required
                    value={text}
                    disabled={isSending}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      // ✅ Cmd/Ctrl + Enter 전송 (중복 방지)
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        submitOnce();
                      }
                    }}
                  />

                  <Button
                    type="button"
                    size="icon"
                    className="absolute right-2 top-2 h-9 w-9 rounded-xl"
                    disabled={isSending || !text.trim()}
                    onClick={(e) => {
                      e.preventDefault();
                      submitOnce();
                    }}
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Tip: <span className="font-medium">Cmd/Ctrl + Enter</span> to send
                  </p>

                  {fetcher.data?.error ? (
                    <p className="mt-1 text-[11px] text-destructive">
                      {fetcher.data.error}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}