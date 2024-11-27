"use client";

import { useNotification } from "@/components/toast";
import { logout as fetchLogout } from "@/service/auth";
import { deleteSession } from "@/service/session";
import { getUser, pinGame, unpinGame } from "@/service/user";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// Define types for the user state
interface UserState {
  chat: string | null;
  id: string | null;
  username: string | null;
  image: string | null;
  history: { _id: string; title: string }[];
  pinned: any;
}

// Define types for the actions
type UserAction =
  | {
      type: "SET_USER";
      payload: {
        id: string | null;
        username: string | null;
        image: string | null;
        pinned: any;
        history: { _id: string; title: string }[];
      };
    }
  | {
      type: "PIN_GAME";
      payload: {
        id: string | null;
        image: string | null;
        title: string | null;
      };
    }
  | {
      type: "PUSH_SESSION";
      payload: {
        _id: string;
        title: string;
      };
    }
  | {
      type: "POP_SESSION";
      payload: {
        _id: string;
      };
    }
  | {
      type: "UNPIN_GAME";
      payload: {
        id: string | null;
      };
    }
  // Appearance
  | { type: "UPDATE_USERNAME"; payload: string | null }
  | { type: "UPDATE_IMAGE"; payload: string | null }
  | { type: "CLEAR_USER" };

// Define type for the context
interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<boolean>;
  handlePin: (id: string, image: string, title: string) => Promise<void>;
  handleUnpin: (id: string) => Promise<void>;
  handleSessionPush: (session: { title: string; _id: string }) => Promise<void>;
  handleSessionPop: (_id: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with initial undefined value
const UserContext = React.createContext<UserContextType | undefined>(undefined);

// Reducer function
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_USER":
      return {
        chat: null,
        id: action.payload.id,
        username: action.payload.username,
        image: action.payload.image,
        history: action.payload.history,
        pinned: action.payload.pinned,
      };
    case "PUSH_SESSION":
      return {
        ...state,
        history: [action.payload, ...state.history],
      };
    case "POP_SESSION":
      return {
        ...state,
        history: state.history.filter(
          (item: { _id: string; title: string }) =>
            item._id !== action.payload._id
        ),
      };
    case "UPDATE_USERNAME":
      return {
        ...state,
        username: action.payload,
      };
    case "UPDATE_IMAGE":
      return {
        ...state,
        image: action.payload,
      };
    case "CLEAR_USER":
      return {
        ...state,
        id: null,
        username: null,
        image: null,
        history: [],
        pinned: [],
      };
    case "PIN_GAME":
      return {
        ...state,
        pinned: [...state.pinned, action.payload],
      };
    case "UNPIN_GAME":
      return {
        ...state,
        pinned: state.pinned.filter(
          (item: { id: string }) => action.payload.id != item.id
        ),
      };
    default:
      return state;
  }
}

// Props type for the provider
interface UserProviderProps {
  children: React.ReactNode;
}

// Provider component
function UserProvider({ children }: UserProviderProps) {
  const notification = useNotification();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [state, dispatch] = React.useReducer(userReducer, {
    chat: null,
    id: null,
    username: null,
    image: null,
    pinned: [],
    history: [],
  });

  useEffect(() => {
    const handleToken = async () => {
      try {
        const response = await getUser();
        if (response.ok) {
          dispatch({
            type: "SET_USER",
            payload: {
              id: response.id ?? null,
              username: response.username ?? null,
              image: response.image ?? null,
              history: response.history ?? [],
              pinned: response.pinned ?? null,
            },
          });
        } else {
          dispatch({
            type: "CLEAR_USER",
          });
        }
      } catch (error) {
        throw Error("Something happen within the backend.");
      } finally {
        setIsLoading(false);
      }
    };

    handleToken();
  }, []);

  const handlePin = async (id: string, image: string, title: string) => {
    const cookies = document.cookie.split(";");
    const hasAuthToken = cookies.some((cookie) =>
      cookie.trim().startsWith("sessionKey=")
    );

    if (!hasAuthToken) {
      notification.showWarning("Authorization required");
      return;
    }

    const response = await pinGame(id);
    setIsLoading(true);
    if (response.ok) {
      notification.showSuccess(`${title} was pinned to sidebar`);
      dispatch({
        type: "PIN_GAME",
        payload: {
          id,
          image,
          title,
        },
      });
    } else {
      if (response.status == 401) {
        notification.showWarning(response.message ?? "Authorization required");
      } else {
        notification.showError(
          `Something went wrong, ${title} was not pinned to sidebar`
        );
      }
    }
    setIsLoading(false);
  };

  const handleUnpin = async (id: string) => {
    const cookies = document.cookie.split(";");
    const hasAuthToken = cookies.some((cookie) =>
      cookie.trim().startsWith("sessionKey=")
    );

    if (!hasAuthToken) {
      notification.showWarning("Authorization required");
      return;
    }

    const response = await unpinGame(id);
    setIsLoading(true);
    if (response.ok) {
      notification.showSuccess(`Game was successfully un-pinned`);
      dispatch({
        type: "UNPIN_GAME",
        payload: {
          id,
        },
      });
    } else {
      if (response.status == 401) {
        notification.showWarning(response.message ?? "Authorization required");
      } else {
        notification.showError(
          `Something went wrong, when game was not un-pinned to sidebar`
        );
      }
    }
    setIsLoading(false);
  };

  const logout = async () => {
    const cookies = document.cookie.split(";");
    const hasAuthToken = cookies.some((cookie) =>
      cookie.trim().startsWith("sessionKey=")
    );

    if (!hasAuthToken) {
      notification.showWarning("Authorization required");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    const response = await fetchLogout();
    if (response.ok) {
      notification.showSuccess(`${state.username} has successfully signed out`);
      dispatch({
        type: "CLEAR_USER",
      });
    } else {
      notification.showError(
        `Something went wrong, ${state.username} was not signed out`
      );
    }
    setIsLoading(false);
    router.push("/login");
  };

  const handleSessionPush = (session: { title: string; _id: string }) => {
    dispatch({ type: "PUSH_SESSION", payload: session });
  };

  const handleSessionPop = async (_id: string) => {
    try {
      const result = await deleteSession(_id);

      if (result.ok) dispatch({ type: "POP_SESSION", payload: { _id } });
      else {
        throw Error("Could not remove session, Try Again");
      }
    } catch (error) {
      notification.showError("Could not remove session, Try Again");
    }

    return;
  };

  const value = {
    state,
    dispatch,
    isLoading,
    setIsLoading,
    handlePin,
    handleUnpin,
    logout,
    handleSessionPush,
    handleSessionPop,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook for using the context
function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export { UserProvider, useUser };
