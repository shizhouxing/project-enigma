"use client";

import React, { useEffect, useState, useReducer, useContext } from "react";
import { useNotification } from "@/components/toast";
import { useRouter } from "next/navigation";
import {
  getUser,
  pinGame,
  unpinGame,
  logout as fetchLogout,
} from "@/service/user";
import { deleteSession } from "@/service/session";

// Types
interface UserState {
  id: string | null;
  username: string | null;
  image: string | null;
  history: { _id: string; title: string }[];
  pinned: any[];
}

type UserAction =
  | { type: "SET_USER"; payload: UserState }
  | { type: "PIN_GAME"; payload: { id: string; image: string; title: string } }
  | { type: "UNPIN_GAME"; payload: { id: string } }
  | { type: "PUSH_SESSION"; payload: { _id: string; title: string } }
  | { type: "POP_SESSION"; payload: { _id: string } }
  | { type: "UPDATE_USERNAME"; payload: string | null }
  | { type: "UPDATE_IMAGE"; payload: string | null }
  | { type: "CLEAR_USER" };

interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
  isLoading: boolean;
  handlePin: (id: string, image: string, title: string) => Promise<void>;
  handleUnpin: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  handleSessionPush: (session: { title: string; _id: string }) => void;
  handleSessionPop: (_id: string) => Promise<void>;
}

// Initial State
const initialState: UserState = {
  id: null,
  username: null,
  image: null,
  pinned: [],
  history: [],
};

// Reducer
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_USER":
      return { ...action.payload };
    case "PUSH_SESSION":
      return { ...state, history: [action.payload, ...state.history] };
    case "POP_SESSION":
      return {
        ...state,
        history: state.history.filter(
          (item) => item._id !== action.payload._id
        ),
      };
    case "UPDATE_USERNAME":
      return { ...state, username: action.payload };
    case "UPDATE_IMAGE":
      return { ...state, image: action.payload };
    case "CLEAR_USER":
      return { ...initialState };
    case "PIN_GAME":
      return { ...state, pinned: [...state.pinned, action.payload] };
    case "UNPIN_GAME":
      return {
        ...state,
        pinned: state.pinned.filter((item) => item.id !== action.payload.id),
      };
    default:
      return state;
  }
}

// Context
const UserContext = React.createContext<UserContextType | undefined>(undefined);

// Provider
function UserProvider({ children }: { children: React.ReactNode }) {
  const notification = useNotification();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getUser();
        dispatch({
          type: response.ok ? "SET_USER" : "CLEAR_USER",
          payload: response.ok
            ? {
                id: response.id ?? null,
                username: response.username ?? null,
                image: response.image ?? null,
                history: response.history ?? [],
                pinned: response.pinned ?? [],
              }
            : initialState,
        });
      } catch (error) {
        notification.showError("Failed to fetch user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const checkAuthorization = () => {
    const hasAuthToken = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("sessionKey="));

    if (!hasAuthToken) {
      notification.showWarning("Authorization required");
      return false;
    }
    return true;
  };

  const handlePin = async (id: string, image: string, title: string) => {
    if (!checkAuthorization()) return;

    setIsLoading(true);
    const response = await pinGame(id);

    if (response.ok) {
      notification.showSuccess(`${title} was pinned to sidebar`);
      dispatch({
        type: "PIN_GAME",
        payload: { id, image, title },
      });
    } else {
      notification.showError(
        response.status === 401
          ? response.message ?? "Authorization required"
          : `Something went wrong, ${title} was not pinned to sidebar`
      );
    }
    setIsLoading(false);
  };

  const handleUnpin = async (id: string) => {
    if (!checkAuthorization()) return;

    setIsLoading(true);
    const response = await unpinGame(id);

    if (response.ok) {
      notification.showSuccess("Game was successfully un-pinned");
      dispatch({ type: "UNPIN_GAME", payload: { id } });
    } else {
      notification.showError(
        response.status === 401
          ? response.message ?? "Authorization required"
          : "Something went wrong when un-pinning game"
      );
    }
    setIsLoading(false);
  };

  const logout = async () => {
    if (!checkAuthorization()) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    const response = await fetchLogout();

    if (response.ok) {
      notification.showSuccess(`${state.username} has successfully signed out`);
      dispatch({ type: "CLEAR_USER" });
    } else {
      notification.showError(
        `Something went wrong, ${state.username} was not signed out`
      );
    }

    setIsLoading(false);
    router.push("/login");
  };

  const handleSessionPop = async (_id: string) => {
    try {
      const result = await deleteSession(_id);
      if (result.ok) {
        dispatch({ type: "POP_SESSION", payload: { _id } });
      } else {
        notification.showError("Could not remove session, Try Again");
      }
    } catch (error) {
      notification.showError("Could not remove session, Try Again");
    }
  };

  const value = {
    state,
    dispatch,
    isLoading,
    handlePin,
    handleUnpin,
    logout,
    handleSessionPush: (session: { title: string; _id: string }) =>
      dispatch({ type: "PUSH_SESSION", payload: session }),
    handleSessionPop,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook
function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export { UserProvider, useUser };
