"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share } from "lucide-react";
import Image from "next/image";
import { postSharedSession } from "@/service/session";
import { useUser } from "@/context/user";
import { useNotification } from "../toast";

export function ShareDialog({
  session_id,
  share_id,
  children,
}: {
  session_id? : string
  share_id?: string;
  children: React.ReactNode;
}) {
  const [link, setLink] = useState<string | undefined>(
    share_id !== undefined ? `${window.location.protocol}//${window.location.host}/share/${share_id}` : undefined
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const notification = useNotification();
  const { state : user } = useUser()

  const createLink = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user.id){
        throw { message : "Authentication required" }
      }
      if (!session_id){
        throw { message : "No Session selected" }
      }

      const response = await postSharedSession(session_id, user.id)
      setLink(`${window.location.protocol}//${window.location.host}/share/${response.data}`);
      notification.showSuccess("Successfully Created Link")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareToX = () => {
    const text = encodeURIComponent("Check out this jailbreak!");
    const url = encodeURIComponent(link ?? "");
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
  };

  const handleShareToReddit = () => {
    const title = encodeURIComponent("Check out this jailbreak!");
    const url = encodeURIComponent(link ?? "");
    window.open(
      `https://www.reddit.com/submit?title=${title}&url=${url}`,
      "_blank"
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Public Link to Chat</DialogTitle>
          <DialogDescription>
            Your username and messages will become public for all users to see.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              disabled
              id="generated-link"
              value={link || "Generate a link first"}
              className="col-span-3"
            />
            <Button
              onClick={createLink}
              disabled={loading}
              className="col-span-1 rounded-3xl"
            >
              {loading ? "Loading..." : "Create Link"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        {link && (
          <div className="  flex flex-row gap-4 items-center justify-center w-full">
            <div
              className="border-[1px] rounded-2xl p-2 border-gray-400 hover:border-gray-300 flex items-center justify-center"
              onClick={handleShareToX}
            >
              <Image
                src={"/X.svg"}
                alt="X"
                className="dark:invert"
                width={15}
                height={15}
              />
            </div>
            <div
              className="border-[1px] rounded-2xl p-2 border-gray-400 hover:border-gray-300 flex items-center justify-center"
              onClick={handleShareToReddit}
            >
              <Image
                src={"/reddit.svg"}
                alt="Reddit"
                className="dark:invert"
                width={15}
                height={15}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
