import * as React from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarProvider,
} from "~/common/components/ui/sidebar";
import { MessageCard } from "../pages/message-card";
import type { Route } from "./+types/message-layout";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getMessages } from "../queries";
import { Button } from "~/common/components/ui/button";
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const messages = await getMessages(client, { userId });
  return {
    userId,
    messages,
  };
};

function MessageList({
  messages,
}: {
  messages: Array<{
    room_id: number | string;
    name: string;
    last_message: string | null;
    avatar: string | null;
  }>;
}) {
  return (
    <SidebarMenu className="px-2 pb-2">
      {messages.map((message) => (
        <MessageCard
          key={message.room_id}
          id={String(message.room_id)}
          name={message.name}
          lastMessage={message.last_message ?? ""}
          avatarUrl={message.avatar ?? undefined}
        />
      ))}
    </SidebarMenu>
  );
}


export default function MessagesLayout({ loaderData }: Route.ComponentProps) {
    const { userId, messages } = loaderData;
    const navigate = useNavigate();
    const { messageRoomId } = useParams();
    const isDetail = Boolean(messageRoomId);
  
    return (
        
      <SidebarProvider className="h-[100dvh] flex flex-col bg-background ">
        {/* ✅ Mobile top bar */}
        <div className="md:hidden shrink-0 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          {isDetail ? (
            <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 md:px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                aria-label="Back to messages"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
  
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Messages</p>
                <p className="truncate text-xs text-muted-foreground">Back to list</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 md:px-4">
              <MessageSquareIcon className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-base font-semibold">Messages</p>
                <p className="text-xs text-muted-foreground">Recent conversations</p>
              </div>
            </div>
          )}
        </div>
  
        {/* ✅ Body */}
        <div className="flex-1 min-h-0">
          {/* ✅ Desktop split */}
          <div className="hidden h-full md:flex">
            <Sidebar variant="floating" className="pt-20">
              <SidebarContent>
                <SidebarGroup>
                  <MessageList messages={messages} />
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
  
            <div className="h-full flex-1 min-h-0">
              <Outlet context={{ userId }} />
            </div>
          </div>
  
          {/* ✅ Mobile: list OR detail */}
          <div className="h-full md:hidden">
            {!isDetail ? (
              <div className="h-full">
                <div className="mx-auto h-full max-w-3xl px-2 py-2">
                  <div className="h-full rounded-2xl border bg-card shadow-sm overflow-hidden">
                    {/* ✅ 여기서 calc 쓰지 말고 그냥 flex로 */}
                    <div className="h-full overflow-y-auto">
                      <MessageList messages={messages} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // ✅ detail은 부모가 이미 topbar 제외한 높이를 갖고 있으니 h-full이면 됨
              <div className="h-full min-h-0">
                <Outlet context={{ userId }} />
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    );
  }