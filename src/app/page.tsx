'use client';
import { useState, useEffect } from "react";
import { getGames } from "@/service/game";
import { GameErrorResponse, type Game } from "@/types/game";
import GameCardGallery from "@/components/game/gallery";
import { AppSidebar, SideBarCloseButton } from "@/components/sidebar";

export default function Game() {
  const [games, setGames] = useState<Game[] | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const data: Game[] | GameErrorResponse = await getGames();
        setGames(data as Game[]);
      } catch (error) {
        console.error("Failed to fetch games:", error);
      }
    }
    fetchGames();
  }, []);

  return (
    <>
      <AppSidebar />
      <main className="flex-1 flex flex-col max-w-full ">
        <SideBarCloseButton />
        <div className="flex-1 pt-14 md:pt-0 ">
          <GameCardGallery games={games ?? []} />
        </div>
      </main>
    </>
  );
}
