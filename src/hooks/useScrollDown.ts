import { useEffect, useState } from "react";

// 判断当前用户是否离开了顶部
const useDetachedFromTop = () => {
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isDetached, setIsScrollDown] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const effect = () => {
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

  return { scrollDistance, isDetached };
};

export { useDetachedFromTop };
