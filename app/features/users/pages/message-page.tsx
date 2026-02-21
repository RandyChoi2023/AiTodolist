// ✅ "1 days ago" -> "1 day ago" + 자동으로 "x minutes/hours/days ago" 표시

import { Card, CardDescription, CardHeader, CardTitle } from "~/common/components/ui/card";
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
import { useEffect, useMemo, useRef } from "react";

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

  // ✅ 마지막 메시지 시간(없으면 null)
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
    messageRoomId: params.messageRoomId,
    message: message as string,
    userId,
  });

  return { ok: true };
};

export default function MessagePage({ loaderData, actionData }: Route.ComponentProps) {
  const { userId } = useOutletContext<{ userId: string }>();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
    }
  }, [actionData]);

  const lastText = useMemo(() => timeAgo(loaderData.lastMessageAt), [loaderData.lastMessageAt]);

  return (
    <div className="h-full flex flex-col justify-between">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={loaderData.participants?.profile?.avatar ?? ""} />
            <AvatarFallback>
              {loaderData.participants?.profile?.name?.charAt(0) ?? ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0">
            <CardTitle>{loaderData.participants?.profile?.name ?? ""}</CardTitle>
            <CardDescription>{lastText}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="py-10 overflow-y-scroll space-y-4 flex flex-col justify-start h-full">
        {loaderData.messages.map((message) => (
          <MessageBubble
            key={message.message_id}
            avatarUrl={message.sender?.avatar ?? ""}
            avatarFallback={message.sender?.name?.charAt(0) ?? ""}
            content={message.content}
            isCurrentUser={message.sender?.profile_id === userId}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <Form ref={formRef} method="post" className="relative flex justify-end item-center">
            <Textarea
              placeholder="Write a message..."
              rows={2}
              className="resize-none"
              required
              name="message"
            />
            <Button type="submit" size="icon" className="absolute right-2 top-4">
              <SendIcon className="size-4" />
            </Button>
          </Form>
        </CardHeader>
      </Card>
    </div>
  );
}
