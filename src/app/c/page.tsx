"use server";
import { Chat } from "@/components/chat";
import { ProtectedRoute } from "@/components/protected_route";

export default async function Page() {
  return (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  );
}
