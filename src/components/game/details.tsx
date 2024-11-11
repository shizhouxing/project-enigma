"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import type { Game } from "@/types/game";
import { validateToken } from '@/service/auth'


interface GameDetailsProps {
  game: Game;
  isAuthenticated?: boolean; // Add this prop to check auth status
}

export function GameDetails({
  game
}: GameDetailsProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const router = useRouter();

  const handlePlayNow = async () => {

    const isvalidtoken = await validateToken();
    if (!isvalidtoken) {
      setShowAuthDialog(true);
      return;
    }
    console.log("valid token");
    // Your existing play now logic here
  };

  const handleLogin = () => {
    router.push("/login"); // Adjust this to your login route
  };

  return (
    <>
      <Button onClick={handlePlayNow} size="lg" className="gap-2 items-center">
        <PlayCircle className="w-5 h-5" />
        Play Now
      </Button>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to play {game?.title}. Please login or go
              back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-1 w-full">
            <div className="w-full">
              <Button
                variant="outline"
                onClick={() => setShowAuthDialog(false)}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
            <div className="w-full">
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
