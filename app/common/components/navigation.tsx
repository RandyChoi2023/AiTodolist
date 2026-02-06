import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "~/common/components/ui/navigation-menu";
import { Link } from "react-router";
import { Separator } from "~/common/components/ui/separator";
import { Button } from "~/common/components/ui/button";
import { cn } from "~/lib/utils";
import { DropdownMenu } from "./ui/dropdown-menu";
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Avatar } from "./ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { BarChart3Icon, BellIcon, LogOutIcon, MessageCircleIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

const menus = [
    {
        name: "My Goals",
        to: "/goals",  
    },
    {
        name: "To Do List",
        to: "/to-do-lists",
    },
    {
        name: "My core list",
        to: "/my-core-list/all-lists",
        items: [
            {
                name: "All Lists",
                description: "all lists description",
                to: "/my-core-list/all-lists",
            },
            {
                name: "Easy list",
                description: "easy list description",
                to: "/my-core-list/easy-list",
            },
            {
                name: "Normal list",
                description: "medium list description",
                to: "/my-core-list/normal-list",
            },
            {
                name: "Hard list",
                description: "hard list description",
                to: "/my-core-list/hard-list",
            },
        ],
    },
    {   
        name: "Motivation",
        to: "/motivation"
    },
]
export default function Navigation({
    isLoggedIn, hasNotifications, hasMessages
}: {
    isLoggedIn?: boolean;
    hasNotifications?: boolean,
    hasMessages?: boolean,
}) {
  return <nav className="flex px-20 h-16 items-center justify-between backdrop-blur fixed top-0 left-0 right-0 z-50 bg-background/50">
  <div className="flex items-center">
    <Link to="/" className="text-2xl font-bold">Just Do AI List</Link>
    <Separator orientation="vertical" className="h-6 mx-4" />
    <NavigationMenu>
        <NavigationMenuList>
            {menus.map((menu) => (
                <NavigationMenuItem key={menu.name}>
                    {menu.items ? <>
                        <NavigationMenuTrigger>
                        <Link to={menu.to}>{menu.name}</Link>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[200px] font-light gap-3">
                        {menu.items?.map((item) => (
                            <NavigationMenuItem key={item.name} className={cn(
                                "select-none rounded-md transition-colors focus:bg-accent hover:bg-accent",
                                item.to === "/my-core-list/easy-list" && "bg-amber-300",
                                item.to === "/my-core-list/normal-list" && "bg-blue-300",
                                item.to === "/my-core-list/hard-list" && "bg-orange-300",
                            )}>
                                <NavigationMenuLink asChild>
                                    <Link className="p-3 space-y-1 block leading-none no-underline outline-none" to={item.to}>
                                        <span>{item.name}</span>
                                        {item.description && (
                                            <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
                                        )}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                        </ul>
                    </NavigationMenuContent>
                    </>: <Link className={navigationMenuTriggerStyle()}to={menu.to}>{menu.name}</Link>}
                </NavigationMenuItem>
            ))}
        </NavigationMenuList>
    </NavigationMenu>
   </div>
   { isLoggedIn ? 
        (
        <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" asChild className="relative">
                <Link to="/my/notifications">
                    <BellIcon className="size-4" />
                    {hasNotifications && (<div className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full"></div>)}
                </Link>
                
            </Button>
            <Button size="icon" variant="ghost" asChild className="relative">
                <Link to="/my/messages">
                    <MessageCircleIcon className="size-4" />
                    {hasMessages && (<div className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full"></div>)}
                </Link>
            </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar>
                    <AvatarImage src="https://avatars.githubusercontent.com/u/126791186?u=7e7a14b519004369bb75e3ac0085f7cc85360e03&v=4&size=64" alt="User Avatar" />
                    <AvatarFallback>
                        N
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-50">
                <DropdownMenuLabel className="flex flex-col">
                    <span className="font-medium">Randy</span>
                    <span className="text-xs text-muted-foreground">@username</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/my/dashboard" className="flex items-center">
                        <BarChart3Icon className="size-4 mr-2" />Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/my/profile" className="flex items-center">
                        <UserRoundIcon className="size-4 mr-2" />
                        Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/my/settings" className="flex items-center">
                        <SettingsIcon className="size-4 mr-2" />
                        Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/auth/logout" className="flex items-center">
                        <LogOutIcon className="size-4 mr-2" />
                        Logout
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            
            </DropdownMenuContent>
        </DropdownMenu>
        </div>
    ) : (
   <div className="flex items-center gap-4">
        <Button asChild variant="secondary">
            <Link to="/auth/login">Login</Link>
        </Button>
        <Button asChild>
            <Link to="/auth/join">Join</Link>
        </Button>
    </div>
    )}
  </nav>
}