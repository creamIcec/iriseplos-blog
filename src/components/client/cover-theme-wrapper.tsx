"use client";

import { ColorMode, isModeDark } from "@/utils/theme";
import { useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

interface CoverThemeWrapperProps {
  children?: ReactNode;
}

export default function CoverThemeWrapper({
  children,
}: CoverThemeWrapperProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const textClass =
    mounted && resolvedTheme && isModeDark(resolvedTheme as ColorMode)
      ? "text-on-surface"
      : "text-surface";

  return <div className={textClass}>{children}</div>;
}
