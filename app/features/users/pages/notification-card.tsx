import * as React from "react";
import { Card, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { EyeIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { cn } from "~/lib/utils";
import { useFetcher } from "react-router";

type NotificationType = "goal" | "todo" | "core" | "mention";

interface NotificationCardProps {
  notificationId: number;
  avatarUrl: string;
  avatarFallback: string;
  userName: string;
  type: NotificationType;     // ✅ string -> union으로
  timestamp: string;
  seen: boolean;
  onSeen?: () => void;
}

// ✅ type → 화면 문구 변환
function getNotificationCopy(type: NotificationType) {
  switch (type) {
    case "goal":
      return { verb: "목표를 만들었습니다.", badge: "Goal" };
    case "todo":
      return { verb: "할 일을 추가했습니다.", badge: "To-do" };
    case "core":
      return { verb: "코어 리스트를 업데이트했습니다.", badge: "Core" };
    case "mention":
      return { verb: "의견이 달렸습니다. ", badge: "Mention" };
    default:
      return { verb: "알림이 도착했습니다.", badge: "Notice" };
  }
}

export function NotificationCard({
  notificationId,
  avatarUrl,
  avatarFallback,
  userName,
  type,
  timestamp,
  seen,
  onSeen,
}: NotificationCardProps) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSubmitting = fetcher.state !== "idle";

  const calledRef = React.useRef(false);

  React.useEffect(() => {
    if (calledRef.current) return;
    if (fetcher.state !== "idle") return;
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      calledRef.current = true;
      onSeen?.();
    }
  }, [fetcher.state, fetcher.data, onSeen]);

  const copy = getNotificationCopy(type);

  return (
    <Card
      className={cn(
        "w-full max-w-[720px]",            // ✅ min-w 고정 대신 반응형
        !seen && "bg-yellow-100",
        isSubmitting && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row gap-5 items-start">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* ✅ 제목: “누가 + 무엇을 했는지” */}
          <CardTitle className="text-lg font-bold flex flex-wrap gap-2 items-center">
            <span>{userName}</span>
            <span className="text-muted-foreground font-normal">{copy.verb}</span>

            {/* ✅ 타입 배지 */}
            <span className="ml-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              {copy.badge}
            </span>

            {!seen ? (
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                NEW
              </span>
            ) : null}
          </CardTitle>

          <small className="text-muted-foreground text-sm">{timestamp}</small>
        </div>
      </CardHeader>

      <CardFooter className="flex items-center justify-end">
        <fetcher.Form method="post" action="/my/see-notification">
          <input type="hidden" name="notificationId" value={notificationId} />

          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={seen || isSubmitting}
            title={seen ? "이미 확인했어" : "확인 처리"}
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
        </fetcher.Form>
      </CardFooter>

      {fetcher.data && !fetcher.data.ok ? (
        <div className="px-4 pb-4 text-sm text-destructive">
          {fetcher.data.error ?? "처리 실패"}
        </div>
      ) : null}
    </Card>
  );
}
