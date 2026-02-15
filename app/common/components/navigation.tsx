import * as React from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/common/components/ui/navigation-menu";

import { Separator } from "~/common/components/ui/separator";
import { Button } from "~/common/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/common/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/common/components/ui/sheet";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";

import {
  BarChart3Icon,
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserRoundIcon,
} from "lucide-react";

type Menu = {
  name: string;
  to: string;
  items?: { name: string; description?: string; to: string }[];
};

const menus: Menu[] = [
  { name: "My Goals", to: "/goals" },
  { name: "To Do List", to: "/to-do-lists" },
  {
    name: "My core list",
    to: "/my-core-list/all-lists",
    items: [
      { name: "All Lists", description: "all lists description", to: "/my-core-list/all-lists" },
      { name: "Easy list", description: "easy list description", to: "/my-core-list/easy" },
      { name: "Normal list", description: "medium list description", to: "/my-core-list/normal" },
      { name: "Hard list", description: "hard list description", to: "/my-core-list/hard" },
    ],
  },
  { name: "Motivation", to: "/motivation" },
  { name: "Subscribe", to: "/subscribe" },
];

function CoreListBadgeBg(to: string) {
  if (to === "/my-core-list/easy") return "bg-amber-300";
  if (to === "/my-core-list/normal") return "bg-blue-300";
  if (to === "/my-core-list/hard") return "bg-orange-300";
  return "";
}

export default function Navigation({
  isLoggedIn,
  hasNotifications,
  hasMessages,
}: {
  isLoggedIn?: boolean;
  hasNotifications?: boolean;
  hasMessages?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 backdrop-blur bg-background/50 border-b">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-20">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[300px] sm:w-[340px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Link to="/" onClick={() => setMobileOpen(false)} className="text-lg font-bold">
                    Just Do AI List
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-2">
                {menus.map((menu) => {
                  if (!menu.items) {
                    return (
                      <Link
                        key={menu.name}
                        to={menu.to}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        {menu.name}
                      </Link>
                    );
                  }

                  return (
                    <Collapsible key={menu.name} className="rounded-md border">
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors">
                        <span>{menu.name}</span>
                        <ChevronDownIcon className="size-4 opacity-70" />
                      </CollapsibleTrigger>

                      <CollapsibleContent className="px-2 pb-2">
                        <div className="flex flex-col gap-1">
                          {menu.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.to}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors",
                                CoreListBadgeBg(item.to)
                              )}
                            >
                              <div className="font-medium">{item.name}</div>
                              {item.description ? (
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              <div className="mt-6">
                <Separator className="my-4" />
                {isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/my/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center"
                    >
                      <BarChart3Icon className="size-4 mr-2" /> Dashboard
                    </Link>
                    <Link
                      to="/my/profile"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center"
                    >
                      <UserRoundIcon className="size-4 mr-2" /> Profile
                    </Link>
                    <Link
                      to="/my/settings"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center"
                    >
                      <SettingsIcon className="size-4 mr-2" /> Settings
                    </Link>
                    <Separator className="my-2" />
                    <Link
                      to="/auth/logout"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center"
                    >
                      <LogOutIcon className="size-4 mr-2" /> Logout
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild variant="secondary" className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link to="/auth/login">Login</Link>
                    </Button>
                    <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                      <Link to="/auth/join">Join</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <Link to="/" className="text-lg sm:text-2xl font-bold">
            Just Do AI List
          </Link>

          <Separator orientation="vertical" className="h-6 hidden md:block" />

          {/* Desktop nav */}
          <div className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {menus.map((menu) => (
                  <NavigationMenuItem key={menu.name}>
                    {menu.items ? (
                      <>
                        {/* Trigger는 메뉴 펼치기 용도로만 */}
                        <NavigationMenuTrigger>{menu.name}</NavigationMenuTrigger>

                        <NavigationMenuContent>
                          <ul className="grid w-[240px] font-light gap-2 p-2">
                            {menu.items.map((item) => (
                              <li
                                key={item.name}
                                className={cn(
                                  "select-none rounded-md transition-colors focus:bg-accent hover:bg-accent",
                                  CoreListBadgeBg(item.to)
                                )}
                              >
                                <NavigationMenuLink asChild>
                                  <Link
                                    className="p-3 space-y-1 block leading-none no-underline outline-none"
                                    to={item.to}
                                  >
                                    <span className="font-medium">{item.name}</span>
                                    {item.description ? (
                                      <p className="text-sm leading-snug text-muted-foreground">
                                        {item.description}
                                      </p>
                                    ) : null}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <Link className={navigationMenuTriggerStyle()} to={menu.to}>
                        {menu.name}
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Button size="icon" variant="ghost" asChild className="relative">
              <Link to="/my/notifications" aria-label="Notifications">
                <BellIcon className="size-4" />
                {hasNotifications ? (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
                ) : null}
              </Link>
            </Button>

            <Button size="icon" variant="ghost" asChild className="relative">
              <Link to="/my/messages" aria-label="Messages">
                <MessageCircleIcon className="size-4" />
                {hasMessages ? (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
                ) : null}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                  <Avatar>
                    <AvatarImage
                      src="https://avatars.githubusercontent.com/u/126791186?u=7e7a14b519004369bb75e3ac0085f7cc85360e03&v=4&size=64"
                      alt="User Avatar"
                    />
                    <AvatarFallback>N</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-medium">Randy</span>
                  <span className="text-xs text-muted-foreground">@username</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/my/dashboard" className="flex items-center">
                      <BarChart3Icon className="size-4 mr-2" />
                      Dashboard
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
          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="secondary">
              <Link to="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/join">Join</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
