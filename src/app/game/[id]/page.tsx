import React from 'react';
import { getGamesFromId } from '@/service/game';
import { notFound, redirect } from 'next/navigation';
import type { Game, GameErrorResponse } from '@/types/game';
import { GameHeader } from '@/components/game/header';
import { GameDetails } from '@/components/game/details';
import { GameSettings } from '@/components/game/setting';

interface GamePageProps {
  params: {
    id: string;
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  let game: Game | GameErrorResponse;
  
  try {
    const response = await getGamesFromId(id);
    game = response as Game;
  } catch (error) {
    console.error("Error fetching game data:", error);
    redirect('/game');
  }

  if (!game) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
        
      <GameHeader game={game} />
      <GameDetails game={game} />
      <GameSettings game={game} />
    </div>
  );
}

