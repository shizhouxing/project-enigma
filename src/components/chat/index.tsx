"use client";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useUser } from "@/context/user";
import { useNotification } from "../toast";
import {
  createTitle,
  endGame,
  forfeitGame,
  GameSessionPublic,
  GameSessionPublicResponse,
} from "@/service/session";
import { Message as MessageComponent } from "./message";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight, Disc, Lock, Share2, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, useChat } from "ai/react";
import useTimer from "@/hooks/use-timer";
import { useRouter, usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";
import { ShareDialog } from "../modal/share";
import { useSidebar } from "../ui/sidebar";
import Loading from "../loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface SharedGameProps {
  title?: string;
  outcome?: "win" | "loss";
  duration?: string;
  username?: string;
  history: Message[];
  modelName?: string;
  modelImage?: string;
  userImage?: string;
}

interface ChatComponentProps {
  session: GameSessionPublicResponse;
  authorization?: string;
}

export const SharedConversation = ({
  outcome,
  username,
  history,
  modelName,
  modelImage,
}: SharedGameProps) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen mx-auto relative w-full max-w-3xl">
        {/* Top gradient */}
        <div className="absolute top-0 w-full bg-gradient-to-t from-transparent to-zinc-950 z-10 rounded-b-xl h-[50px]" />

        {/* Model info header */}
        <div className="absolute top-4 right-4 flex items-center space-x-3 z-20">
          {modelName && modelImage && (
            <div className="flex items-center space-x-2">
              <img
                src={modelImage}
                alt={modelName}
                className="h-6 w-6 object-cover rounded-xl border-[1px] border-zinc-500"
              />
              <span className="text-md font-normal text-white">
                {modelName}
              </span>
            </div>
          )}
          {outcome && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 text-sm select-none">
                  {outcome === "win" ? (
                    <Unlock className="text-green-400 h-4 w-4" />
                  ) : (
                    <Lock className="text-red-400 h-4 w-4" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{outcome === "win" ? "Jailbroken" : "Unbroken"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 w-full">
          <div className="relative flex-1 overflow-hidden mt-2 mx-auto p-6 pt-8">
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet
              </div>
            ) : (
              <div className="flex flex-col space-y-4 px-4 pb-4">
                {history.map((message, idx) => (
                  <MessageComponent
                    className="rel"
                    key={`${message.role}-message-${idx}`}
                    variant={message.role}
                  >
                    {message.role === "user" && (
                      <MessageComponent.Avatar
                        className="mt-[.65rem] ml-[.30rem]"
                        src={undefined}
                        fallback={username ? username[0] : "U"}
                      />
                    )}
                    <MessageComponent.Content
                      className={cn(
                        message.role === "user" && "items-end font-light pr-2",
                        message.role === "assistant" && "px-2 font-medium"
                      )}
                    >
                      {message.content}
                    </MessageComponent.Content>
                  </MessageComponent>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 w-full bg-gradient-to-b from-transparent to-zinc-950 z-10 h-[70px]" />
      </div>
    </TooltipProvider>
  );
};

export const ChatComponent = ({
  session,
  authorization,
}: ChatComponentProps) => {
  const router = useRouter();
  const { state: user, isLoading: isUserLoading } = useUser();
  // State
  const [showTargetModal, setShowTargetModal] = useState(!session.completed);
  const [hasText, setHasText] = useState(false);
  const [outcome, setOutcome] = useState<null | "win" | "loss" | "forfeit">(
    null
  );

  // Ref
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Hook
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const notification = useNotification();
  const { seconds, isComplete, start, pause, formatTime } = useTimer(30 * 60);

  const {
    messages,
    setMessages,
    handleSubmit,
    handleInputChange,
    stop,
    isLoading,
  } = useChat({
    api: `/api/${session.id}/chat_conversation/${user.id}/conversation`,
    headers: {
      Authorization: `Bearer ${authorization}`,
    },
    initialMessages: session.history,
    streamProtocol: "text",

    onResponse: async (response) => {
      if (!response.ok) {
        notification.showError(
          "An error occurred while connecting to the server."
        );
        return;
      }

      if (response.status === 204 && outcome !== "win") {
        setMessages([]);
        notification.showError("There is currently no live session.");
        router.refresh();
        return;
      }

      notification.showSuccess("Stream started");

      let reader;
      try {
        reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and append the chunk to the buffer
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Process all complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
              const chunk = JSON.parse(line);

              switch (chunk.event) {
                case "message":
                  handleNewMessage(chunk.content);
                  break;

                case "error":
                  notification.showError(chunk.message);
                  break;

                case "end":
                  if (chunk.outcome === "win") {
                    await handleSessionEnd(messages, chunk.outcome);
                  }
                  break;

                default:
                  console.warn("Unhandled event type:", chunk.event);
              }
            } catch (e) {
              console.error("Error parsing chunk:", line, e);
            }
          }

          // Keep the last incomplete line in the buffer
          buffer = lines[lines.length - 1];
        }

        // Process any remaining buffer content
        processRemainingBuffer(buffer);
      } catch (error) {
        notification.showError("Error processing stream");
        console.error(error);
      } finally {
        if (reader) reader.releaseLock();
      }
    },

    onError: (error) => {
      notification.showError(error.message);
      console.error(error);
    },

    onFinish: () => {
      notification.showSuccess("Stream finished successfully");
    },
  });

  // Helper to handle a new message chunk
  const handleNewMessage = (content: any) => {
    setMessages((prevMessages: any) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage?.role === "assistant") {
        return [
          ...prevMessages.slice(0, -1),
          { ...lastMessage, content: lastMessage.content + content },
        ];
      }
      return [...prevMessages, { role: "assistant", content }];
    });
  };

  // Helper to handle session end
  const handleSessionEnd = async (messages: any, outcome: any) => {
    console.log(session.id, user.id);
    if (session.id && user.id) {
      if (messages.length >= 2) {
        const messageContent = `Message:${messages
          .slice(0, 2)
          .map((item: any) => item.content)
          .join("\n\nMessage:")}`;

        try {
          const response = await createTitle(
            session.id,
            user.id,
            messageContent
          );
          if (!response.ok) {
            throw new Error(
              `Failed to create session title: ${response.message}`
            );
          }
        } catch (error) {
          notification.showError("Failed to create session title");
          console.error(error);
          return;
        }
      } else if (messages.length === 0) {
        notification.showWarning("No Content Within Session");
      }

      if (outcome === "loss") {
        const endResponse = await endGame(session.id, user.id);

        if (!endResponse.ok) {
          throw new Error(`Failed to process game end: ${endResponse.message}`);
        }
      }

      router.refresh();
    }
  };

  // Helper to process the remaining buffer
  const processRemainingBuffer = (buffer: any) => {
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer);
        if (chunk.event === "message") {
          handleNewMessage(chunk.content);
        }
      } catch (e) {
        notification.showError(`Error parsing final chunk: ${buffer}, ${e}`);
      }
    }
  };

  useEffect(() => {
    // Check if session.description is available and not empty
    if (!session.completed && session.description) {
      // Show the target modal
      setShowTargetModal(true);
    }
  }, [session.description]);

  useEffect(() => {
    // This effect runs when the component mounts
    console.log(session);
    if (!session.ok) {
      router.push("/");
    }
    return () => {
      // This cleanup function runs when the component unmounts
      if (!session.completed && outcome === null) {
        window.history.replaceState(null, "", window.location.pathname);
        // You can add your session cleanup logic here
      }
    };
  }, [session, outcome]); // Dependency array ensures that it wat

  // On message stream scroll to the bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView(false);
    }
  }, [messages]);

  useEffect(() => {
    if (outcome !== null && !session.completed) {
      pause(); // Pause timer to indicate the end of the game
      handleSessionEnd(messages, outcome); // Call the async handler
    }
  }, [outcome, messages, session.id, user.id]);

  // handle input
  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;

    if (textarea) {
      setHasText(e.target.value.length > 0);
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set new height based on scrollHeight, with max lines limit
      const lineHeight = 24; // Assuming 24px line height
      const maxHeight = lineHeight * 6;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      handleInputChange(e);
    }
  };

  // handle enter key
  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = textareaRef.current?.value.trim();
      if (message) {
        if (textareaRef.current && user.id) {
          setHasText(false);
          textareaRef.current.value = "";
          // Reset height after sending
          textareaRef.current.style.height = "auto";
          handleSubmit(e);
        }
      }
    }
  };

  useEffect(() => {
    if (isComplete && outcome === null) {
      // Use functional update to ensure state is set correctly
      setOutcome((prevOutcome) => prevOutcome ?? "loss");
    }
  }, [isComplete, outcome]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [session, textareaRef]);

  // Replace your existing useEffect forfeit logic with this:
  useEffect(() => {
    // State to track the forfeit status
    const forfeitState = {
      shouldForfeit: false,
      isForfeitInProgress: false,
    };

    // Function to handle forfeiting the game
    const handleForfeit = async () => {
      if (
        forfeitState.shouldForfeit &&
        !forfeitState.isForfeitInProgress &&
        !session.completed &&
        outcome === null &&
        session.id &&
        user.id
      ) {
        forfeitState.isForfeitInProgress = true; // Prevent multiple forfeit attempts

        try {
          const result = await forfeitGame(session.id, user.id);

          if (!result.ok || result.status === 204) {
            router.push("/"); // Redirect if forfeiting failed
          } else {
            router.refresh(); // Refresh the page if forfeiting succeeded
          }
        } catch (error) {
          console.error("Forfeit failed:", error);
          router.push("/");
        } finally {
          forfeitState.isForfeitInProgress = false; // Reset forfeit progress flag
        }
      }
    };

    // Listener for visibility changes (e.g., tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        forfeitState.shouldForfeit = true; // Mark forfeit as required
        handleForfeit(); // Attempt to forfeit immediately
      }
    };

    // Listener for the `beforeunload` event (warn user before leaving)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!session.completed && outcome === null) {
        forfeitState.shouldForfeit = true; // Mark forfeit as required
        event.returnValue = ""; // Trigger browser's default confirmation dialog
      }
    };

    // Listener for the `unload` event (ensure API call on page exit)
    const handleUnload = async () => {
      console.warn("Unloading Function Call");
      if (
        forfeitState.shouldForfeit &&
        !forfeitState.isForfeitInProgress &&
        !session.completed &&
        outcome === null &&
        session.id &&
        user.id
      ) {
        // Make a final attempt to forfeit the game
        try {
          const result = await forfeitGame(session.id, user.id);

          if (!result.ok || result.status === 204) {
            console.warn("Forfeit failed during unload");
          }
        } catch (error) {
          console.error("Forfeit error during unload:", error);
        }
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!session.completed) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("unload", handleUnload);
    }

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!session.completed) {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("unload", handleUnload);
      }
    };
  }, [session.id, user.id, outcome, session.completed]);

  if (isUserLoading || !session.ok) {
    return (
      <Loading
        fullScreen
        className="flex items-center justify-center w-full h-screen text-center relative"
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen mx-auto relative w-full max-w-4xl">
        {/* Messages Container */}
        <div
          className={cn(
            "absolute top-0 w-full bg-gradient-to-t from-transparent to-zinc-950 z-10 rounded-b-xl",
            !session.completed ? "h-[100px]" : "h-[50px]"
          )}
        />

        {/* Model info for completed session */}

        <div className="absolute top-4 right-4 flex items-center space-x-3 z-20">
          {!session.completed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-3 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 text-sm select-none">
                  <span
                    className={cn(
                      "font-mono",
                      isComplete || (seconds < 10 && "text-red-400")
                    )}
                  >
                    {formatTime()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time remaining</p>
              </TooltipContent>
            </Tooltip>
          )}
          {session.completed && (
            <>
              <div className="flex items-center space-x-2">
                <img
                  src={session.model?.image}
                  alt={session.model?.name}
                  className="h-6 w-6 object-cover rounded-xl border-[1px] border-zinc-500"
                />
                <span className="text-md font-normal text-white select-none cursor-default">
                  {session.model?.name}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 text-sm select-none">
                    {session.outcome === "win" ? (
                      <Unlock className="text-green-400 h-4 w-4" />
                    ) : (
                      <Lock className="text-red-400 h-4 w-4" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.outcome === "win" ? "Jailbroken" : "Unbroken"}</p>
                </TooltipContent>
              </Tooltip>
              {session.history?.length !== 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ShareDialog
                      session_id={session.id}
                      share_id={session.shared ?? undefined}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50"
                      >
                        <Share2 className="h-4 w-4 text-zinc-200" />
                      </Button>
                    </ShareDialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share conversation</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 w-full">
          <div
            className={cn(
              "relative flex-1 overflow-hidden mt-2 mx-auto p-6",
              session.completed ? "pt-8" : "pt-12",
              isMobile && "pt-14"
            )}
          >
            {session.completed && messages.length === 0 ? (
              <div className="inset-0 flex items-center text-center justify-center my-auto mt-10">
                <span className="text-gray-500">
                  There are no messages here.
                  <p className="text-gray-500">
                    This chat will be removed shortly.
                  </p>
                </span>
              </div>
            ) : (
              <>
                <div
                  className="flex flex-col space-y-4 px-2 sm:px-4 pb-4 overflow-auto max-w-full"
                  ref={scrollAreaRef}
                >
                  {messages.map((message, idx) => (
                    <MessageComponent
                      className="relative"
                      key={`${message.role}-message-${idx}`}
                      variant={message.role}
                    >
                      {message.role === "user" && (
                        <MessageComponent.Avatar
                          className="mt-[.65rem] ml-[.30rem]"
                          src={user.image ?? undefined}
                          fallback={user.username ? user.username[0] : "U"}
                        />
                      )}
                      <MessageComponent.Content
                        className={cn(
                          "break-words", // Ensure text wraps properly
                          message.role === "user" &&
                            "items-end font-light pr-2",
                          message.role === "assistant" && "px-2 font-medium"
                        )}
                      >
                        {message.content}
                      </MessageComponent.Content>
                    </MessageComponent>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <div
          className={cn(
            "absolute bottom-0 w-full bg-gradient-to-b from-transparent to-zinc-950 z-10",
            !session.completed ? "h-[200px]" : "h-[10px]"
          )}
        />

        {/* Input Container */}
        {!session.completed && (
          <div className="w-full relative z-10">
            <Card className="border-zinc-700/50 flex flex-col gap-1.5 pl-4 pt-2.5 pr-2.5 pb-2.5 items-stretch transition-all duration-200 relative shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.035)] focus-within:shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.075)] hover:border-zinc-600 focus-within:border-zinc-600 cursor-text z-10 rounded-t-2xl rounded-b-none border-b-0">
              <div className="relative flex">
                <Textarea
                  ref={textareaRef}
                  placeholder="Let's Start Cracking..."
                  className="resize-none text-md overflow-y-auto bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-400 min-h-[24px] max-h-[144px] pb-8"
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  disabled={isComplete || outcome === "win"}
                  rows={1}
                />
                <div
                  className={cn(
                    "absolute top-1 right-2 flex gap-2 transition-all duration-200 transform",
                    (hasText && !isLoading) || isLoading
                      ? "opacity-100 translate-x-0 scale-100"
                      : "opacity-0 translate-x-4 scale-95 pointer-events-none"
                  )}
                >
                  {hasText && !isLoading && (
                    <Button
                      onClick={(e) => {
                        const message = textareaRef.current?.value.trim();
                        if (message) {
                          if (textareaRef.current && user.id) {
                            setHasText(false);
                            textareaRef.current.value = "";
                            textareaRef.current.style.height = "auto";
                            handleSubmit(e);
                          }
                        }
                      }}
                      className="rounded-xl transition-colors duration-200 hover:scale-105"
                      variant="ghost"
                      size="icon"
                      disabled={isComplete}
                    >
                      <ArrowRight className="h-5 w-5 text-zinc-400" />
                    </Button>
                  )}
                  {isLoading && (
                    <Button
                      onClick={() => {
                        notification.showSuccess("Stop stream");
                        stop();
                      }}
                      className="rounded-xl transition-colors duration-200 hover:scale-105"
                      variant="ghost"
                      size="icon"
                    >
                      <Disc className="h-5 w-5 text-zinc-400" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-row space-x-2 cursor-default select-none">
                <img
                  src={session.model?.image}
                  alt={session.model?.name}
                  className={cn(
                    `h-6 w-6 object-cover rounded-xl border-[1px] border-zinc-500 cursor-default`,
                    isLoading && "animate-spin",
                    "hover:animate-spin"
                  )}
                />
                <span
                  className={cn(
                    `text-md font-normal text-white`,
                    isLoading && "animate-pulse"
                  )}
                >
                  {session.model?.name}
                </span>
              </div>
              <div className="absolute right-3 bottom-2 text-xs text-zinc-500 cursor-default select-none">
                Press{" "}
                <code className="text-xxs p-[2px] border-[1px] rounded-lg">
                  Shift + Enter
                </code>{" "}
                for new line
              </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showTargetModal} onOpenChange={setShowTargetModal}>
        <DialogTrigger asChild>
          <Button variant="outline">Game Target</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Game Target</DialogTitle>
            {session.description}
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowTargetModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
