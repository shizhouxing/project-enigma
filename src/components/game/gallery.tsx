"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Game } from "@/types/game";
import Link from "next/link";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

function GameCardComponent({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} key={game.id}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <div className="relative h-48 w-full flex items-center justify-center">
          <img
            src={game.image}
            alt={game.title}
            className="object-contain opacity-80"
          />
          <CardTitle className="text-2xl font-bold text-white absolute">
            {game.title}
          </CardTitle>
        </div>
      </Card>
    </Link>
  );
}

const GameCardGallery = ({ games }: { games: Game[] }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredGames = games.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No games found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game: Game) => (
            <GameCardComponent key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameCardGallery;