"use server";

import { SharedConversation } from "@/components/chat";
import { getSharedSession } from "@/service/session";
import { redirect } from "next/navigation";

export default async function Share({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sharedGame = await getSharedSession(id);
  if (!sharedGame.ok) {
    redirect("/");
  }

  return (
    <SharedConversation
      outcome={sharedGame.outcome ?? undefined}
      username={sharedGame.username}
      title={sharedGame.title}
      history={sharedGame.history ?? []}
      modelImage={sharedGame.model?.image}
      modelName={sharedGame.model?.name}
    />
  );
}
