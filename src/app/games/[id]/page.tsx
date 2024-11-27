import React, { Suspense } from "react";
import { getGamesFromId } from "@/service/game";
import { redirect } from "next/navigation";
import type { Game, GameErrorResponse } from "@/types/game";
import { GameHeader } from "@/components/game/header";
import { GameDetails } from "@/components/game/details";
import { GameSettings } from "@/components/game/setting";
import Loading from "@/components/loading";
import { Skeleton } from "@/components/ui/skeleton";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  let game: Game | GameErrorResponse;
  try {
    const response = await getGamesFromId(id);
    game = response as Game;
  } catch (error) {
    console.error("Error fetching game data:", error);
    redirect("/game");
  }

  if (!game) {
    redirect("/game");
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <GameHeaderSkeleton />
          <GameDetailsSkeleton />
          <GameSettingsSkeleton />
        </div>
      }
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <GameHeader game={game} />
        <GameDetails game={game} />
        <GameSettings game={game} />
      </div>
    </Suspense>
  );
}

function GameHeaderSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="space-y-2 flex-grow">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function GameDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/4" />
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="w-20 h-20" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GameSettingsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  );
}