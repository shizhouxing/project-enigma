import { API_CONFIG } from "@/lib/config/api";
import { client } from "./api";
import { Game, GameErrorResponse } from "@/types/game";

export async function getGames(): Promise<Game[] | GameErrorResponse> {
  try {
    const response = await client.get<Game[]>(
      `${API_CONFIG.ENDPOINTS.GAME}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        cache: "no-cache"
      }
    );

    // Ensure we're returning the data part of the response
    return response;
  } catch (error: any) {
    console.error("Error checking games:", error);
    return {
      status: error?.response?.status,
      message: "Failed to retrieve games",
      details: error?.message || "An unknown error occurred"
    } as GameErrorResponse;
  }
}


export async function getGamesFromId(id : string): Promise<Game | GameErrorResponse> {
  try {
    const response = await client.get<Game>(
      `${API_CONFIG.ENDPOINTS.GAME}${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        cache: "no-cache"
      }
    );

    // Ensure we're returning the data part of the response
    return response;
  } catch (error: any) {
    console.error("Error checking games:", error);
    throw Error(error)
  }
}
