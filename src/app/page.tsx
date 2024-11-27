import { Suspense } from "react";
import GameCardGallery from "@/components/game/gallery";
import { GAMES_CACHE, getGames } from "@/service/game";
import { GameErrorResponse, type Game } from "@/types/game";
import Loading from "@/components/loading";
import { AppSidebar, SideBarCloseButton } from "@/components/sidebar";

export default async function Game() {
  const games: Game[] | GameErrorResponse = await getGames();

  return (
    <>
      <AppSidebar />
      <main className="flex-1 flex flex-col max-w-full ">
        <SideBarCloseButton/>
        <div className="flex-1 pt-14 md:pt-0 ">
          <GameCardGallery games={(games as Game[]) ?? []} />
        </div>
      </main>
    </>
  );
}
