import { GameSessionPublic } from "@/service/session";
import { useReducer } from "react";

type Message = { role: 'user' | 'assistant'; content: string };

interface ChatState {
  id: string;
  outcome : 'win' | 'loss' | 'forfeit' | null
}

type ChatAction =
  | { type: 'START_CHAT'; id: string, messages : Message[]}
  | { type: "ALLOC_TITLE"; title: string }
  | { type: "FORFEIT_CHAT" }
  | { type: "END_CHAT"; outcome: 'win' | 'loss' }

export const initialState: ChatState = {
  id: '',
  outcome : null
};

export const chatReducer = (state: ChatState = initialState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "START_CHAT":
      return {
        ...state,
        id: action.id,
      };
    case "FORFEIT_CHAT":
      return {
        ...state,
        outcome : "forfeit"
      };

    case "END_CHAT":
      return {
        ...state,
        outcome : action.outcome
      };
    default:
      return state;
  }
};
