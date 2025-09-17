"use client";

import { ColorMode, isModeDark } from "@/utils/theme";
import { useTheme } from "next-themes";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

interface CoverProps {
  children?: ReactNode;
  enableMask?: boolean;
}

export default function Cover({ children, enableMask = true }: CoverProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const textClass =
    mounted && resolvedTheme && isModeDark(resolvedTheme as ColorMode)
      ? "text-on-surface"
      : "text-surface";

  return (
    <div className={`relative w-full h-140 md:h-160 ${textClass}`}>
      <Image
        src="/cover/default-cover.jpg"
        alt="cover image"
        className="absolute top-0 left-0 object-cover w-full h-full rounded-b-4xl"
        loading="lazy"
        width={1920}
        height={1080}
      />
      {enableMask && (
        <div className="absolute inset-0 bg-black/40 rounded-b-4xl" />
      )}
      {children}
    </div>
  );
}
