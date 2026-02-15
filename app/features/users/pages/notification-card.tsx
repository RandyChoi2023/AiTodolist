import { Card, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Avatar,AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { EyeIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { cn } from "~/lib/utils";


interface NotificationCardProps {
    avatarUrl: string;
    avatarFallback: string;
    userName: string;
    message: string;
    timestamp: string;
    seen: boolean;
}

export function NotificationCard({ 
    avatarUrl,
    avatarFallback,
    userName,
    message,
    timestamp, 
    seen,
}: NotificationCardProps) {
    return (
        <Card className={cn("min-w-[450px]", seen ? "" : "bg-yellow-100")}>
        <CardHeader className="flex flex-row gap-5 items-start">
            <Avatar>
                <AvatarImage src={avatarUrl}/>
                <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg font-bold">
                    <span>{ userName }</span>
                    <span>{ message }</span>
                </CardTitle>
                <small className="text-muted-foreground text-sm">{ timestamp }</small>
            </div>
        </CardHeader>
        <CardFooter>
            <Button variant={"outline"} size="icon">
                <EyeIcon className="w-4 h-4"/>
            </Button>
        </CardFooter>
    </Card>
    )
} 