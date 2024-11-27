"use server";
import { ChatComponent } from "@/components/chat";
import AuthMonitor from "@/hooks/useCookieCheck";
import {
  GameSessionPublic,
  GameSessionPublicResponse,
  getSession,
} from "@/service/session";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "@/components/loading";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params;
  const session = await getSession(id);
  return {
    title: (session as GameSessionPublic).title ?? "New Game",
    description: `Game session: ${(session as GameSessionPublic).title}`,

    openGraph: {
      title: (session as GameSessionPublic).title ?? "New Game",
      description: `Game session: ${(session as GameSessionPublic).title}`,
      images: [
        {
          url: "/redarena.png",
          width: 796,
          height: 468,
          alt: "Red Arena Game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: (session as GameSessionPublic).title ?? "New Game",
      description: `Game session: ${(session as GameSessionPublic).title}`,
      images: ["/redarena.png"],
    },
  };
}
export default async function Page({ params }: ChatPageProps) {
  const { id } = await params;
  const session: GameSessionPublicResponse = await getSession(id);

  const cookeStore = cookies();
  const authorization = (await cookeStore).get("sessionKey")?.value;

  return (
    <Suspense
      fallback={
        <Loading
          fullScreen
          className="flex items-center justify-center w-full h-screen text-center relative"
        />
      }
    >
      <AuthMonitor>
        <ChatComponent
          session={session as GameSessionPublic}
          authorization={authorization}
        />
      </AuthMonitor>
    </Suspense>
  );
}
