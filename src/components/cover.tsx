// Cover.tsx
import Image from "next/image";
import { ReactNode } from "react";
import CoverThemeWrapper from "./client/cover-theme-wrapper";

interface CoverProps {
  children?: ReactNode;
  enableMask?: boolean;
  src?: string;
  alt?: string;
}

export default function Cover({
  children,
  src,
  alt = "",
  enableMask = true,
}: CoverProps) {
  return (
    <div className="relative w-full h-140 md:h-160">
      {src && (
        <Image
          src={src}
          alt={alt}
          className="absolute top-0 left-0 object-cover w-full h-full rounded-b-4xl"
          loading="lazy"
          width={1920}
          height={1080}
        />
      )}
      {enableMask && (
        <div className="absolute inset-0 bg-black/40 rounded-b-4xl" />
      )}
      <CoverThemeWrapper>{children}</CoverThemeWrapper>
    </div>
  );
}
