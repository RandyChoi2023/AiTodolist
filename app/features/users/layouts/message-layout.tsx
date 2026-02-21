import { Outlet, useOutletContext } from "react-router";
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarProvider } from "~/common/components/ui/sidebar";
import { MessageCard } from "../pages/message-card";
import type { Route } from "./+types/message-layout";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getMessages } from "../queries";

export const loader = async ({request}: Route.LoaderArgs) => {
    const { client } = await makeSSRClient(request);
    const userId = await getLoggedInUserId(client);
    const messages = await getMessages(client, {userId});
    return { 
        userId,
        messages, 
    };
}

export default function MessagesLayout({loaderData}: Route.ComponentProps) {
    const { userId } = loaderData; // ✅ loaderData에서 가져오기
    return (
        <SidebarProvider className="flex max-h-[calc(100vh-14rem)] overflow-hidden h-[calc(100vh-14rem)] min-h-full">
            <Sidebar className="pt-16" variant="floating">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                        {loaderData.messages.map((message) => (
                                <MessageCard 
                                key={message.room_id}
                                id={message.room_id.toString()}
                                name={message.name}
                                lastMessage={message.last_message}
                                avatarUrl={message.avatar}
                                />
                        ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
            <div className="w-full h-full">
                <Outlet 
                context= {{ userId }}
                />
            </div>    
        </SidebarProvider>
        
    );
}