"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthMonitor = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    // Function to check if auth token exists
    const checkAuthToken = () => {
      const cookies = document.cookie.split(";");
      const hasAuthToken = cookies.some((cookie) =>
        cookie.trim().startsWith("auth-token=")
      );

      if (!hasAuthToken) {
        router.push("/login");
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
  }, [router]);

  return <>{children}</>; // This component doesn't render anything
};

export default AuthMonitor;
