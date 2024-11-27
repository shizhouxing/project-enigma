'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBeforeUnload } from 'react-use';

interface GameExitOptions {
  /** Whether to show exit confirmation dialog */
  alertOnExit?: boolean;
  /** Current game session ID */
  sessionId: string;
  /** Callback function to handle forfeit */
  onForfeit?: () => Promise<void>;
  /** Custom warning message */
  warningMessage?: string;
}

/**
 * Hook to handle game exits and forfeits
 * Shows confirmation dialog when user attempts to leave the game
 * Triggers forfeit callback if user confirms exit
 */
export const useGameForceExit = ({
  alertOnExit = true,
  sessionId,
  onForfeit,
  warningMessage = "Leaving results in an automatic forfeit, which will decrease your ELO rating. Are you sure you want to leave?"
}: GameExitOptions) => {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  // Handle browser close/reload
  useBeforeUnload(alertOnExit, warningMessage);

  useEffect(() => {
    let isHandlingExit = false;

    const handleForfeit = async () => {
      if (isHandlingExit) return;
      
      try {
        setIsExiting(true);
        isHandlingExit = true;
        
        if (onForfeit) {
          await onForfeit();
        }
      } catch (error) {
        console.error('Failed to process forfeit:', error);
      } finally {
        isHandlingExit = false;
        setIsExiting(false);
      }
    };

    // Handle browser close/reload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!alertOnExit) return;
      
      e.preventDefault();
      handleForfeit();
      return (e.returnValue = warningMessage);
    };

    // Handle tab/window visibility change
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && alertOnExit) {
        const shouldExit = window.confirm(warningMessage);
        
        if (shouldExit) {
          await handleForfeit();
        }
      }
    };

    // Handle route change attempts
    const handleRouteChange = (url: string) => {
      if (!alertOnExit) return;

      const shouldExit = window.confirm(warningMessage);
      
      if (shouldExit) {
        handleForfeit();
      } else {
        // Prevent navigation if user cancels
        router.events?.emit('routeChangeError');
        throw 'Route change cancelled';
      }
    };

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    router.events?.on('routeChangeStart', handleRouteChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [alertOnExit, sessionId, onForfeit, warningMessage, router]);

  return { isExiting };
};