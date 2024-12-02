"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/user";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Label,
  Pie,
  PieChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { GameStats, userStats } from "@/service/user";
// import { MetricsChart } from "@/components/chart/model";

const WinLossChartData = [
  { date: "2024-11-01", wins: 12, losses: 8 },
  { date: "2024-11-02", wins: 8, losses: 8 },
  { date: "2024-11-03", wins: 10, losses: 0 },
  // ... more data
];

const WinLossChartConfig = {
  wins: {
    label: "Wins",
    color: "hsl(142, 76%, 36%)",
  },
  losses: {
    label: "Losses",
    color: "hsl(346, 87%, 43%)",
  },
} satisfies ChartConfig;

const chartData = [
  { provider: "OpenAI", played: 10, fill: "var(--color-openai)" },
  { provider: "Anthropic", played: 10, fill: "var(--color-anthropic)" },
  { provider: "firefox", played: 10, fill: "var(--color-firefox)" },
  { provider: "edge", played: 10, fill: "var(--color-edge)" },
  { provider: "other", played: 7, fill: "var(--color-other)" },
];

const chartConfig = {
  played: {
    label: "Played",
  },
  openai: {
    label: "OpenAI",
    color: "hsl(var(--chart-1))",
  },
  anthropic: {
    label: "Anthropic",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function Profile() {

  const { state: user, isLoading } = useUser();
  
  const [stats, setStats] = useState<null | GameStats>(null);
  const [timeRange, setTimeRange] = React.useState("90d");
  const [isStatLoading, setIsStatLoading] = React.useState(true);


  useEffect(() => {
    const handleUserStats =  async () => {
      const response = await userStats();
      setStats(response as GameStats);
      console.log(response);
      setIsStatLoading(false);
    } 
    

    handleUserStats()
  }, [])
  
  const rank = 1;
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.played, 0);
  }, []);

  const filteredData = WinLossChartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date(Date.now());
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Side-by-side layout */}
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Avatar Card */}
        <Card className="w-full md:w-1/3 flex justify-center items-center">
          <CardContent className="relative flex flex-col items-center justify-center">
            {/* Centered Avatar */}
            {isLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : (
              <div className="relative flex flex-col items-center justify-center min-h-60 max-h-60">
                <Avatar className=" relative">
                  <AvatarImage
                    className="min-w-20 max-w-40 min-h-20 max-h-40 sm:h-40 sm:w-40 w-32 h-32 rounded-full"
                    src={user.id ? `/api/avatar/${user.id}` :  undefined}
                    alt={user.username ?? "username"}
                  />
                  <AvatarFallback className=" flex items-center justify-center text-2xl bg-gray-200 text-gray-700 rounded-full">
                    {(user.username ?? "00").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Rank Badge */}
                <div
                  className={`absolute text-sm bg-black border-[1px] rounded-full p-1 bottom-10 right-0 ${
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
            )}
            {/* Username */}
            {isLoading ? (
              <Skeleton className="mt-4 h-6 w-32" />
            ) : (
              <p className="mt-0 text-lg font-semibold text-center">
                {user.username ?? "Username"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Component Card */}
        <Card className="w-full md:w-2/3">
          <CardContent className="w-full flex flex-wrap justify-between mx-auto gap-4">
            <ChartContainer
              config={chartConfig}
              className="aspect-square max-h-[250px] flex-1"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="played"
                  nameKey="provider"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              # Games Played
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ChartContainer
              config={chartConfig}
              className="aspect-square max-h-[250px] flex-1"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="played"
                  nameKey="provider"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              JB Ratio
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <Card className="w-full h-full min-h-full">
        {isLoading ? (
          <Skeleton className="h-full" />
        ) : (
          <CardContent className="aspect-auto h-[350px] w-full">
            <div className="flex justify-center">
              <ChartContainer
                config={WinLossChartConfig}
                className="aspect-auto h-[350px] w-full p-5"
              >
                <AreaChart width={500} height={250} data={filteredData}>
                  <defs>
                    <linearGradient id="fillWins" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient id="fillLosses" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(346, 87%, 43%)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(346, 87%, 43%)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="wins"
                    type="monotone"
                    fill="url(#fillWins)"
                    stroke="hsl(142, 76%, 36%)"
                    stackId="a"
                  />
                  <Area
                    dataKey="losses"
                    type="monotone"
                    fill="url(#fillLosses)"
                    stroke="hsl(346, 87%, 43%)"
                    stackId="a"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
