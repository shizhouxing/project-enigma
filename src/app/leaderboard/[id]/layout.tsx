import Loading from "@/components/loading";
import { AppSidebar, SideBarCloseButton } from "@/components/sidebar";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "RedArena Games",
  description: "...",
};

export default function SubLeaderboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense
        fallback={
          <Loading
            fullScreen
            className="flex items-center justify-center w-full h-screen text-center relative"
          />
        }
      >
        <AppSidebar />
        <main className="flex-1 flex flex-col max-w-full ">
          <SideBarCloseButton />
          <div className="flex-1 pt-14 md:pt-0 ">{children}</div>
        </main>
      </Suspense>
    </>
  );
}
