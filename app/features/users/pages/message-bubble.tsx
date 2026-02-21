import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { cn } from "~/lib/utils";

interface MessageBubbleProps {
  avatarUrl: string;
  avatarFallback: string;
  content: string;
  isCurrentUser?: boolean;
}

export function MessageBubble({
  avatarUrl,
  avatarFallback,
  content,
  isCurrentUser = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {/* 상대방일 때만 아바타 보여주는 게 보통 더 깔끔함 */}
      {!isCurrentUser ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-[11px]">
            {(avatarFallback || "U").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div className={cn("max-w-[78%] md:max-w-[70%]")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm",
            "whitespace-pre-wrap break-words",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {content}
        </div>
      </div>

      {/* 내 메시지일 때 아바타를 굳이 보여주고 싶으면 아래 주석 해제 */}
      {/* {isCurrentUser ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[11px]">ME</AvatarFallback>
        </Avatar>
      ) : null} */}
    </div>
  );
}