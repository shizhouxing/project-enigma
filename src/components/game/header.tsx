"use client";
import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Game } from "@/types/game";

interface GameHeaderProps {
  game: Game;
}

export function GameHeader({ game }: GameHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleStar = async (starred: boolean) => {
    // Here you would implement the API call to update the star count
    console.log("Star status changed:", starred);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/games">
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-6">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
          <Image
            alt={`${game.title} logo`}
            src={game.image}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex-1">
          {/* NOTE: Add this back in when functional  */}
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
            {/* <AnimatedStarButton 
              initialStars={game.stars} 
              onStar={handleStar}
            /> */}
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(game.created_at)}</span>
            </div>
            {game.metadata.game_rules.timed && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {game.metadata.game_rules.time_limit / 1000}s
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {game.author.map((author) => (
              <Badge key={author} variant="secondary">
                {author}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
