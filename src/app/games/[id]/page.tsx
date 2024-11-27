import React, { Suspense } from "react";
import { getGamesFromId } from "@/service/game";
import { redirect } from "next/navigation";
import type { Game, GameErrorResponse } from "@/types/game";
import { GameHeader } from "@/components/game/header";
import { GameDetails } from "@/components/game/details";
import { GameSettings } from "@/components/game/setting";
import { GameDetailsSkeleton, GameHeaderSkeleton, GameSettingsSkeleton } from "@/components/skeleton/game";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  let game: Game | null = null;

  try {
    const response = await getGamesFromId(id);
    if ("error" in response) {
      console.error("API returned an error:", response.error);
      redirect("/");
      return;
    }
    game = response as Game;
  } catch (error) {
    console.error("Error fetching game data:", error);
    redirect("/");
    return;
  }

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <GameHeaderSkeleton />
        <GameDetailsSkeleton />
        <GameSettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <GameHeader game={game} />
      <GameDetails game={game} />
      <GameSettings game={game} />
    </div>
  );
}