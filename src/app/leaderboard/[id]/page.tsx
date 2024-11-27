import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardSkeleton } from "@/components/skeleton/leaderboard";

interface LeaderboardProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Leaderboard({ params }: LeaderboardProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto p-4 text-center h-full">
      <Suspense
        fallback={
          <div className="flex w-full space-x-5">
            <LeaderboardSkeleton />
            <LeaderboardSkeleton />
          </div>
        }
      >
        Early Access Currently No Leaderboard
        {/* Actual leaderboard content would go here */}
      </Suspense>
    </div>
  );
}

