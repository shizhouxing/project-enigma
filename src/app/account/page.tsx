"use client";

import { Component } from "@/components/chart/model";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/context/user";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useEffect, useState } from "react";

const winsLossesData = [
  { date: "2024-10-01", wins: 12, losses: 8 },
  { date: "2024-10-02", wins: 8, losses: 8 },
  { date: "2024-10-03", wins: 2, losses: 0 },
  // ... more data
];

const metrics = {
  wins: {
    label: "Wins",
    color: "hsl(142, 76%, 36%)",
  },
  losses: {
    label: "Losses",
    color: "hsl(346, 87%, 43%)",
  },
};

export default function Profile() {
  const { state: user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const rank = 1;

  useEffect(() => {
    // Add logic here if necessary
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Side-by-side layout */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Avatar Card */}
        <Card className="w-full md:w-1/3 flex justify-center items-center">
          <CardContent className="relative flex flex-col items-center justify-center">
            {/* Centered Avatar */}
            <div className="relative flex flex-col items-center">
              <Avatar className="h-40 w-40">
                <AvatarImage
                  className="h-40 w-40 rounded-full"
                  src={user.image ?? undefined}
                  alt={user.username ?? "username"}
                />
                <AvatarFallback className="h-40 w-40 flex items-center justify-center text-2xl bg-gray-200 text-gray-700 rounded-full">
                  {(user.username ?? "00").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Rank Badge */}
              <div
                className={`-mt-8 absolute text-sm bg-black border-[1px] rounded-full p-1 bottom-0 right-0 ${
                  rank === 1
                    ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 border-yellow-500 animate-shimmer"
                    : rank === 2
                    ? "bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 border-gray-400 animate-shimmer"
                    : rank === 3
                    ? "bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500 border-orange-500 animate-shimmer"
                    : "bg-black border-gray-500"
                }`}
              >
                <span className="font-medium">
                  {rank === 1
                    ? "🥇 #1"
                    : rank === 2
                    ? "🥈 #2"
                    : rank === 3
                    ? "🥉 #3"
                    : `#${rank}`}
                </span>
              </div>
            </div>

            {/* Username */}
            <p className="mt-4 text-lg font-semibold text-center">
              {user.username ?? "Username"}
            </p>
          </CardContent>
        </Card>

        {/* Component Card */}
        <Card className="w-full md:w-2/3">
          <Component />
        </Card>
      </div>

      {/* Additional Cards (if needed) */}
      <Card className="w-full">
        <CardContent className="pt-6">
          {/* <MetricsChart data={winsLossesData} metrics={metrics} /> */}
        </CardContent>
      </Card>
    </div>
  );
}
