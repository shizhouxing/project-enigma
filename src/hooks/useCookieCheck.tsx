"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthMonitor = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Function to check if auth token exists
    const checkAuthToken = () => {
      const cookies = document.cookie.split(";");
      const hasAuthToken = cookies.some((cookie) =>
        cookie.trim().startsWith("sessionKey=")
      );

      // If on login page and authenticated, redirect to home
      if (pathname === "/login" && hasAuthToken) {
        router.push("/");
        return;
      }

      // If not on login page and not authenticated, redirect to login
      if (pathname !== "/login" && !hasAuthToken) {
        router.push("/login");
        return;
      }
    };

    // Check immediately
    checkAuthToken();

    // Set up an interval to check periodically
    const intervalId = setInterval(checkAuthToken, 1000);

    // Listen for cookie changes
    const cookieListener = () => {
      checkAuthToken();
    };

    // Add event listener for cookie changes
    document.addEventListener("cookie-changed", cookieListener);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("cookie-changed", cookieListener);
    };
  }, [router, pathname]); // Added pathname to dependencies

  return <>{children}</>;
};

export default AuthMonitor;