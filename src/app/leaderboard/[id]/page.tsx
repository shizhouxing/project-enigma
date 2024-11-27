import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Leaderboard({ params }: LeaderboardProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<LeaderboardSkeleton />}>
        {/* Actual leaderboard content would go here */}
        <div className="flex w-full space-x-5">
          <LeaderboardSkeleton />
          <LeaderboardSkeleton />
        </div>
      </Suspense>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-1/4" />
      </div>
      {[...Array(10)].map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
