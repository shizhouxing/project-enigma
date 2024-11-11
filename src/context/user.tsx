'use client';
import React from "react";

// Define types for the user state
interface UserState {
  username: string | null;
  image: string | null;
}

// Define types for the actions
type UserAction = 
  | { type: 'SET_USER'; payload: { username: string; image: string } }
  | { type: 'UPDATE_USERNAME'; payload: string }
  | { type: 'UPDATE_IMAGE'; payload: string }
  | { type: 'CLEAR_USER' };

// Define type for the context
interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
}

// Create the context with initial undefined value
const UserContext = React.createContext<UserContextType | undefined>(undefined);

// Reducer function
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_USER':
      return {
        username: action.payload.username,
        image: action.payload.image
      };
    case 'UPDATE_USERNAME':
      return {
        ...state,
        username: action.payload
      };
    case 'UPDATE_IMAGE':
      return {
        ...state,
        image: action.payload
      };
    case 'CLEAR_USER':
      return {
        username: null,
        image: null
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
  const [state, dispatch] = React.useReducer(userReducer, {
    username: null,
    image: null
  });

  const value = { state, dispatch };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for using the context
function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { UserProvider, useUser };