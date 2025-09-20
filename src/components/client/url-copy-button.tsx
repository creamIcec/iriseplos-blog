"use client";

import type { ToastState } from "@react-stately/toast";
import { Icon, IconButton } from "actify";
import { ReactNode, useEffect, useState, useRef } from "react";

interface UrlCopyButtonProps {
  toastState?: ToastState<ReactNode>;
  className?: string;
}

export default function UrlCopyButton({
  toastState,
  className,
}: UrlCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  // 使用 ref 记录当前的 toast key，避免依赖 toastState
  const toastKeyRef = useRef<string | number | undefined>(undefined);

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
    if (!copied || !toastState) {
      return;
    }

    // 只在 copied 变为 true 时添加 toast
    toastKeyRef.current = toastState.add("复制成功~", {
      timeout: 3000,
    });

    // 清理函数
    return () => {
      if (toastKeyRef.current && toastState) {
        toastState.close(toastKeyRef.current.toString());
        toastKeyRef.current = undefined;
      }
    };
  }, [copied]); // 移除 toastState 依赖

  return (
    <>
      <IconButton onClick={copyCurrentUrl}>
        <Icon className={className}>Share</Icon>
      </IconButton>
    </>
  );
}
