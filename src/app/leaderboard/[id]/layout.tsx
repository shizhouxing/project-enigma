import Loading from "@/components/loading";
import { AppSidebar, SideBarCloseButton } from "@/components/sidebar";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://project-enigma-620119407459.us-central1.run.app/"),
  title: "RedArena Leaderboard",
  description:
    "A community-driven redteaming platform",
  keywords : [
    "AI",
    "machine learning",
    "deep learning",
    "RedArena",
    "artificial intelligence",
    "developer tools",
    "AI research",
  ],
  authors: [{ name: "RedArena Team" }, { name: "LLMSYS", url: "https://lmsys.org/" }, { name : "Luca Vivona" }] ,
  openGraph: {
    type: "website",
    url : "https://project-enigma-620119407459.us-central1.run.app",
    title: "RedArena Leaderboard",
    description:
      "A community-driven redteaming platform",
    images: [
      {
        url: "/og-card.png",
        width: 796,
        height: 460,
        alt: "Redarena Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lmarena_ai", // Replace with your actual Twitter handle
    title: "RedArena Leaderboard",
    description:
      "A community-driven redteaming platform",
    images: [
      {
        url: "/og-card.png",
        width: 796,
        height: 460,
        alt: "Redarena Logo",
      },
    ],
  },
  // Add more metadata as needed
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
