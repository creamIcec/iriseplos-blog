"use client";

import type { ToastState } from "@react-stately/toast";
import { Icon, IconButton } from "actify";
import { ReactNode, useEffect, useState } from "react";

interface UrlCopyButtonProps {
  toastState?: ToastState<ReactNode>;
  className?: string;
}

export default function UrlCopyButton({
  toastState,
  className,
}: UrlCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  useEffect(() => {
    if (!copied) {
      return;
    }

    const key = toastState?.add("复制成功~", {
      timeout: 3000,
    });

    return () => {
      if (key) {
        toastState?.close(key);
      }
    };
  }, [copied, toastState]);

  return (
    <>
      <IconButton onClick={copyCurrentUrl}>
        <Icon className={className}>Share</Icon>
      </IconButton>
    </>
  );
}
