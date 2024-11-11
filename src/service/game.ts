import { API_CONFIG } from "@/lib/config/api";
import { createStream } from "@/lib/sse";
import { Game, GameErrorResponse } from "@/types/game";

export async function getGameStream() : Promise<ReadableStream<any>> {
  const response = await fetch(`${process.env.FRONTEND_HOST}${API_CONFIG.ENDPOINTS.GAME}stream?s=0`);
  
  const stream = createStream(response,{
    eventTypes : ["messages", "error"],
    transformData : (data : string) => { return JSON.parse(data);  },
  });

  
  return stream;
}

export async function getGames(skip : number = 0, include : number = 0): Promise<Game[] | GameErrorResponse> {
  try {
    const response = await fetch(`${process.env.FRONTEND_HOST}${API_CONFIG.ENDPOINTS.GAME}?s=${skip}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      cache: "default",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: response.status,
        message: "Failed to retrieve games",
        details: errorData.message || "An unknown error occurred",
      } as GameErrorResponse;
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error checking games:", error);
    return {
      status: error?.response?.status,
      message: "Failed to retrieve games",
      details: error?.message || "An unknown error occurred",
    } as GameErrorResponse;
  }
}

export async function getGamesFromId(id: string): Promise<Game | GameErrorResponse> {
  try {
    const response = await fetch(`${process.env.FRONTEND_HOST}${API_CONFIG.ENDPOINTS.GAME}${id}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        status: response.status,
        message: "Failed to retrieve game",
        details: errorData.message || "An unknown error occurred",
      } as GameErrorResponse;
    }

    const data = await response.json();
    console.log()
    return data;
  } catch (error: any) {
    console.error("Error checking games:", error);
    throw new Error(error);
  }
}