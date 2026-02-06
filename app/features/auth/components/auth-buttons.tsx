import { GithubIcon, LockIcon, MessageCircleIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Separator } from "~/common/components/ui/separator";


import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "~/common/components/ui/popover";


export default function AuthButtons() {
    
    return (
        // 추후에 업데이트 예정 
        // <div className="w-full flex flex-col items-center gap-5">
        //     <div className="w-full flex flex-col items-center gap-2">
        //     <Separator className="w-full"/>
        //     <span className="text-sm text-muted-foreground uppercase font-light">
        //         Or continue with
        //     </span>
        //     <Separator className="w-full"/>
        //     </div>
        //     <div className="w-full flex flex-col gap-2">
        //     <Button variant="outline" className="w-full" asChild>
        //         <Link to="/auth/social/kakao/start">
        //             <MessageCircleIcon className="w-4 h-4"/> Kakao Talk
        //         </Link>
        //     </Button>
        //     <Button variant="outline" className="w-full" asChild>
        //         <Link to="/auth/social/github/start">
        //             <GithubIcon className="w-4 h-4"/> Github
        //         </Link>
        //     </Button>
        //     <Button variant="outline" className="w-full" asChild>
        //         <Link to="/auth/social/otp/start">
        //             <LockIcon className="w-4 h-4"/> OTP
        //         </Link>
        //     </Button>
        //     </div>
        // </div>

        <div className="w-full flex flex-col items-center gap-5">
        <div className="w-full flex flex-col items-center gap-2">
          <Separator className="w-full" />
          <span className="text-sm text-muted-foreground uppercase font-light">
            Or continue with
          </span>
          <Separator className="w-full" />
        </div>
  
        <div className="w-full flex flex-col gap-2">
          {[
            { label: "Kakao Talk", icon: MessageCircleIcon },
            { label: "Github", icon: GithubIcon },
            { label: "OTP", icon: LockIcon },
          ].map(({ label, icon: Icon }) => (
            <Popover key={label}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </PopoverTrigger>
  
              <PopoverContent className="w-56">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Coming soon</p>
                  <p className="text-xs text-muted-foreground">
                    This login method is currently under development.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>

    );
}