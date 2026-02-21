import { Link, useLocation } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { SidebarMenuButton, SidebarMenuItem } from "~/common/components/ui/sidebar";
import { cn } from "~/lib/utils";

interface MessageCardProps {
    id: string;
    avatarUrl?: string | null;
    name: string;
    lastMessage?: string | null;
  }

export function MessageCard({ id, avatarUrl, name, lastMessage }: MessageCardProps) {
  const location = useLocation();
  const active = location.pathname === `/my/messages/${id}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className={cn(
          // ✅ 터치 영역 크게
          "h-auto py-3",
          // ✅ 카드 느낌 + 부드러운 상호작용
          "rounded-2xl border bg-card shadow-sm",
          "hover:bg-muted/40 active:scale-[0.99] transition",
          // ✅ active 강조
          active ? "border-primary/40 bg-muted/40" : "border-transparent"
        )}
      >
        <Link to={`/my/messages/${id}`} className="block">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm">
                {(name?.slice(0, 2) || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{name}</span>

                {/* 나중에 시간 붙일 거면 여기 */}
                {/* <span className="shrink-0 text-xs text-muted-foreground">09:12</span> */}
              </div>

              <div className="mt-1">
                <span className="block truncate text-xs text-muted-foreground">
                  {lastMessage?.trim() ? lastMessage : "No messages yet"}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}