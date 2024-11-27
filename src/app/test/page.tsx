'use client'
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const GamePage = () => {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const handleRouteChange = () => {
      console.log(pathname)
      if (pathname !== "/test") {
        // Call the forfeit API only when leaving "/game"
        alert('leaving')
      }
    };

    // Handle route change and update the previous pathname
    handleRouteChange();
    previousPathname.current = pathname;
  }, [pathname]);

  return <div>Your game page content here!</div>;
};

export default GamePage;
