"use client";
import Loading from "@/components/loading";
import { SearchComponent } from "@/components/searchbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useUser } from "@/context/user";
import {
  GameSessionRecentItem,
  GameSessionRecentItemResponse,
  getHistory,
} from "@/service/session";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Recent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<GameSessionRecentItem[]>([]);

  const handleHistory = async () => {
    const recent: GameSessionRecentItemResponse = await getHistory(
      0,
      undefined
    );
    setLoading(false);

    if (recent.ok) {
      setHistory(recent.content ?? []);
    }
  };

  useEffect(() => {
    handleHistory();
  }, []);

  // const onSearch = (query: string) => {
  //   // Placeholder for search functionality
  //   console.log(query);
  // };

  if (loading) {
    return (
      <Loading
        fullScreen
        className="flex items-center justify-center w-full h-screen text-center relative"
      />
    );
  }

  return (
    <>
      <div className="h-screen w-full bg-background md:p-20 p-10">
        {/* Search Bar */}
        {/* <SearchComponent onSearch={onSearch} /> */}

        <p className="mt-2 text-center md:text-lg text-md font-medium text-gray-200">
          You have {history.length} previous chats within RedArena
        </p>

        {/* History List */}
        <div className="mt-4 space-y-4 w-full">
          {history.map((item) => (
            <Card
              key={item.session_id}
              className="p-3 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow hover:border-gray-500 duration-300"
            >
              <CardContent>
                <Link href={`/c/${item.session_id}`}>
                  <div className="text-lg font-semibold text-primary">
                    {item.title}
                  </div>
                </Link>
              </CardContent>
              <CardFooter className="-mb-5">Last message 1 day ago</CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
