// hooks/useAutoTheme.ts
import React from "react";
import {
  changeColor,
  getCurrentMode,
  getCurrentSeedColor,
} from "../utils/theme";

const useAutoTheme = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);

    if (typeof window.matchMedia !== "function") return;

    const handleChange = () => {
      const mode = getCurrentMode();
      const color = getCurrentSeedColor();
      if (mode === "system") {
        changeColor(color!);
      }
    };

    const isDark = window.matchMedia("(prefers-color-scheme: dark)");
    const isLight = window.matchMedia("(prefers-color-scheme: light)");

    if (typeof isLight.addEventListener === "function") {
      isDark.addEventListener("change", handleChange);
      isLight.addEventListener("change", handleChange);

      return () => {
        isDark.removeEventListener("change", handleChange);
        isLight.removeEventListener("change", handleChange);
      };
    }
  }, []);

  return { isMounted };
};

export { useAutoTheme };
