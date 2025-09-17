// components/theme-initializer.tsx
"use client";

import {
  changeColorAndMode,
  getCurrentMode,
  getCurrentSeedColor,
} from "@/utils/theme";
import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const initTheme = () => {
      console.log("ThemeInitializer: 开始初始化主题");
      const mode = getCurrentMode() || "system";
      const color = getCurrentSeedColor() || "#ecaa2e";

      console.log("获取的配置:", { mode, color });
      changeColorAndMode(color, mode);
      console.log("主题初始化完成");
    };

    // 确保在 hydration 完成后执行
    const timer = setTimeout(initTheme, 0);
    return () => clearTimeout(timer);
  }, []);

  // 不渲染任何 UI
  return null;
}
