import { useState, useEffect } from "react";

/**
 * 检测用户是否正在滚动页面的 React 钩子
 * @param delay 滚动停止后多少毫秒将状态设为非滚动(默认 150ms)
 * @returns 一个布尔值，表示用户当前是否正在滚动
 */
function useScrolling(delay: number = 150): boolean {
  const [isScrolling, setIsScrolling] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: number | null = null;

    const handleScroll = () => {
      setIsScrolling(true);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setIsScrolling(false);
      }, delay);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delay]);

  return isScrolling;
}

export default useScrolling;
