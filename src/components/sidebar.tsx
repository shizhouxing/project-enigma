"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  SquarePen,
  LogOut,
  PanelRightOpen,
  Swords,
  PanelLeftOpen,
  SquareArrowOutUpRight,
  LogIn,
  MoveRight,
  MessagesSquare,
  MoreHorizontal,
  ChartColumn,
  PinOff,
  Trash,
  Star,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenuSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSubTrigger,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { useUser } from "@/context/user";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "./loading";
import { StarFilledIcon } from "@radix-ui/react-icons";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const {
    state: user,
    dispatch,
    handleUnpin,
    isLoading,
    handleSessionPop,
  } = useUser();
  // use game dispatch to deploy game environment.
  if (isLoading) {
    return (
      <Sidebar
        className={cn("duration-150", "opacity-80 backdrop-blur")}
        variant="floating"
        collapsible="offcanvas"
      >
        <div className="flex items-center justify-center h-full">
          <Loading size="sm" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar
      className={cn("duration-150", "opacity-80 backdrop-blur")}
      variant="floating"
      collapsible="offcanvas"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                  {" "}
                  <PanelRightOpen />{" "}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <SidebarGroup>
          <SidebarGroupContent className=" space-y-1">
            <div
              onClick={() => {
                router.push("/");
              }}
            >
              <SidebarMenuItem
                key={"games"}
                className={cn(
                  "flex items-center px-1 py-1 cursor-pointer hover:bg-accent rounded-lg transition-colors"
                )}
              >
                <SidebarMenuButton>
                  <div className="flex items-center space-x-2">
                    <Swords className="h-5 w-5" />
                    <span className="font-medium">RedArena Games</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
            {user.pinned.map(
              (game: { id: string; image: string; title: string }) => {
                return (
                  <SidebarMenuItem
                    key={`games-${game.id}`}
                    className={cn(
                      "flex items-center px-1 py-1 cursor-pointer hover:bg-accent rounded-lg transition-colors"
                    )}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        router.push(`/games/${game.id}`);
                      }}
                    >
                      <div className="flex items-center space-x-0">
                        <Avatar className="w-7 h-7 rounded-3xl">
                          <AvatarImage src={game.image ?? "vercel.svg"} />
                          <AvatarFallback>
                            {game.title.split(" ").length > 1
                              ? game.title[0].toUpperCase()
                              : game.title.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{game.title}</span>
                      </div>
                    </SidebarMenuButton>
                    <div className="flex items-center">
                      <SidebarMenuAction
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add your edit handler here
                        }}
                      ></SidebarMenuAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="mt-1">
                          <SidebarMenuAction>
                            <MoreHorizontal className="h-4 w-4" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() => {
                              handleUnpin(game.id);
                            }}
                          >
                            <PinOff />
                            <span>Unpin</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(`/leaderboard/${game.id}`);
                            }}
                          >
                            <ChartColumn />
                            <span>Leaderboard</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SidebarMenuItem>
                );
              }
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className=" -mt-3 h-[calc(100vh-10rem)]">
          <SidebarGroup>
            <SidebarGroupLabel className=" font-bold">
              Recents
            </SidebarGroupLabel>

            <SidebarGroupContent className=" space-y-1">
              {user.history.map((chat: { _id : string, title : string }) => {
                return (
                  <div
                    key={chat._id}
                    className={cn(
                      "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-lg transition-colors group",
                      pathname === `/c/${chat._id}` && "bg-zinc-900"
                    )}
                    onClick={() => {
                      router.push(`/c/${chat._id}`);
                    }}
                  >
                    <MessagesSquare className="h-4 w-4 ml-1 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {chat.title}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <button className="hover:bg-accent rounded p-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={async () => {
                            await handleSessionPop(chat._id);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => {}}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          <span>Star</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              {user.history.length >= 10 && (
                <Link href={"/recents"} className=" cursor-auto ">
                  <div className="flex ml-2  w-full items-center space-x-2 text-xs hover:underline">
                    View All <MoveRight className="ml-1" width={15} />
                  </div>
                </Link>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="px-2 z-10">
        <div className="flex items-center justify-between">
          {user.username ? (
            <SidebarDropDownMenu />
          ) : (
            <Link href={"/login"} className="w-full text-sm flex">
              <Button
                variant="ghost"
                className="w-full items-center justify-between"
              >
                <span>Login</span>
                <LogIn />
              </Button>
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

const SidebarDropDownMenu = () => {
  const { state: user, logout } = useUser();
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full items-center justify-center gap-3">
          <Button
            className="flex bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2"
            variant="ghost"
            size="icon"
          >
            <Avatar className="w-8 h-8 rounded-3xl">
              <AvatarImage src={user.image ?? "vercel.svg"} />
              <AvatarFallback>??</AvatarFallback>
            </Avatar>
            {/* <span className="font-medium">{user.username ?? "Username"}</span> */}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <Link href="/account">
            <DropdownMenuItem
              onKeyDown={(e: React.KeyboardEvent) => {
                if (
                  (e.metaKey || e.ctrlKey) &&
                  e.shiftKey &&
                  e.key.toLowerCase() === "p"
                ) {
                  e.preventDefault();
                  router.push("/account");
                }
              }}
              tabIndex={0}
            >
              <span>Account</span>

              <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Learn More</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem asChild>
                  <Link href={"https://lmsys.org/"}>
                    <SquareArrowOutUpRight />
                    <span>About LMSYS</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={process.env.FRONTEND_HOST ?? "/terms_of_service"}>
                    <SquareArrowOutUpRight />
                    <span>Terms of Service</span>
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <SquareArrowOutUpRight />
                  <span>Usage Policy</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SquareArrowOutUpRight />
                  <span>Privacy Policy</span>
                </DropdownMenuItem> */}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const SideBarCloseButton = () => {
  const { open, isMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    return (
      <nav className=" absolute top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b z-10 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="hover:bg-accent"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </nav>
    );
  }

  return (
    <Button
      className={cn(
        "fixed z-10 transition-all duration-200 ease-in-out",
        // Mobile positioning and styling
        isMobile
          ? "top-4 left-4 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background/90"
          : // Desktop positioning and styling
            "mt-4 ml-2 bg-transparent",
        // Hide button when sidebar is open on desktop
        open && !isMobile ? "opacity-0 pointer-events-none" : "opacity-100",
        // Additional mobile-specific styles
        isMobile && open ? "" : "translate-x-0"
      )}
      variant={isMobile ? "outline" : "ghost"}
      size="icon"
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
    >
      <PanelLeftOpen className={cn("h-4 w-4", isMobile && "text-foreground")} />
    </Button>
  );
};
