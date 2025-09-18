import { useEffect, useState } from "react";

const SUFFICIENT_WIDTH = 768;

export const useWindowSize = () => {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const handle = () => {
      setIsWide(window.innerWidth >= SUFFICIENT_WIDTH);
    };

    setIsWide(window.innerWidth >= SUFFICIENT_WIDTH);

    window.addEventListener("resize", handle);

    return () => {
      window.removeEventListener("resize", handle);
    };
  }, []);

  return {
    isWide,
  };
};
