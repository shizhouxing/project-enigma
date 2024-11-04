import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Game } from "@/types/game";
import { Button } from "../ui/button";
import { PlayCircle } from "lucide-react";

interface GameDetailsProps {
  game: Game;
}

export function GameDetails({ game }: GameDetailsProps) {
  return (
    <>
      <Button size="lg" className="gap-2 item-cen">
        <PlayCircle className="w-5 h-5" />
        Play Now
      </Button>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-300 leading-relaxed">
                {game.description}
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-2">Gameplay</h2>
              <p className="text-gray-300 leading-relaxed">{game.gameplay}</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-2">Objective</h2>
              <p className="text-gray-300 leading-relaxed">{game.objective}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
