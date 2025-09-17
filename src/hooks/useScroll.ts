import { useEffect, useState } from "react";

const useScroll = () => {
  const [scrollDistance, setScrollDistance] = useState<number>(0);
  const [isScrollDown, setIsScrollDown] = useState<boolean>(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const effect = (e: Event) => {
      const currentScrollY = window.scrollY;
      setScrollDistance(window.scrollY);
      setIsScrollDown(currentScrollY > lastScrollY);

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", effect);

    return () => {
      window.removeEventListener("scroll", effect);
    };
  }, []);

  return { scrollDistance, isScrollDown };
};

export { useScroll };
