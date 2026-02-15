import type { Route } from "./+types/notifications-page"
import { NotificationCard } from "./notification-card";




export const meta: Route.MetaFunction = () => {
    return [{title: "AI to do list"}];
};
export default function NotificationsPage(){
    return (
        <div className="space-y-20">
            <h1 className="text-4xl font-bold"> Notifications</h1>
            <div className="flex flex-col items-start gap-5">
              <NotificationCard
                  avatarUrl="https://github.com/stevejobs.png"
                  avatarFallback="s"
                  userName="steve jobs"
                  message="followed you"
                  timestamp="2 days ago"
                  seen={false} 
              >

              </NotificationCard>
            </div>
            
        </div>
    )
}