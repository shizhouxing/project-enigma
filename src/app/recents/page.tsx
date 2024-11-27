"use client";
import Loading from "@/components/loading";
import { SearchComponent } from "@/components/searchbar";
import { Card } from "@/components/ui/card";
import { useUser } from "@/context/user";
import {
  GameSessionRecentItem,
  GameSessionRecentItemResponse,
  getHistory,
} from "@/service/session";
import { useEffect, useState } from "react";

export default function Recent() {
  const { isLoading } = useUser();
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

  const onSearch = (query: string) => {
    // Placeholder for search functionality
    console.log(query);
  };

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
      <div className="h-screen w-full max-w-md mx-auto bg-background p-4">
        {/* Search Bar */}
        <SearchComponent onSearch={onSearch} />

        <>You have { history.length } previous chats with in RedArena</>

        {/* History List */}
        <div className="mt-4 space-y-4">
          {history.map((item) => (
            <Card
              key={item.session_id}
              className="p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-lg font-semibold text-primary">
                {item.title}
              </div>
              <div className="text-sm text-gray-400">Last message 1 day ago</div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
