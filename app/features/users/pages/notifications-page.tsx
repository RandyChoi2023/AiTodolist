

import * as React from "react";
import { DateTime } from "luxon";
import type { Route } from "./+types/notifications-page";
import { makeSSRClient } from "~/supa-client";
import { NotificationCard } from "./notification-card";
import { getLoggedInUserId, getNotifications } from "../queries";

import { useRevalidator } from "react-router";

export const meta: Route.MetaFunction = () => [{ title: "Notifications | AI to do list" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const notifications = await getNotifications(client, { userId });
  return { notifications };
};

export default function NotificationsPage({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();

  // ✅ 로컬 state로 관리 (즉시 seen 반영)
  const [items, setItems] = React.useState(() => loaderData.notifications);

  // ✅ loaderData가 바뀌면 동기화 (revalidate 후 반영)
  React.useEffect(() => {
    setItems(loaderData.notifications);
  }, [loaderData.notifications]);

  function markSeen(notificationId: number) {
    setItems((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, seen: true } : n
      )
    );

    // ✅ root loader까지 다시 돌려서 네비 빨간점도 갱신
    revalidator.revalidate();
  }

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold">Notifications</h1>

      <div className="flex flex-col items-start gap-5">
        {items.map((notification) => (
          <NotificationCard
            key={notification.notification_id}
            notificationId={notification.notification_id}
            avatarUrl={notification.source?.avatar ?? ""}
            avatarFallback={notification.source?.name?.[0] ?? ""}
            userName={notification.source?.name ?? ""}
            type={notification.type}
            timestamp={
              DateTime.fromISO(notification.created_at)
                .setLocale("ko")
                .toRelative() ?? ""
            }
            seen={notification.seen}
            onSeen={() => markSeen(notification.notification_id)} // ✅ 추가
          />
        ))}
      </div>
    </div>
  );
}
