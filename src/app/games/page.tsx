import GameCardGallery from "@/components/game/gallery";
import { getGames } from "@/service/game";

export default async function Game() {
  const games: any = await getGames();

  return (
    <>
      <GameCardGallery games={games} />
    </>
  );
}
