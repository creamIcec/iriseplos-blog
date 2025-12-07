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

    // 复制成功, 更新key
    toastKeyRef.current = toastState.add("复制成功~", {
      timeout: 3000,
    });

    // 清理函数
    return () => {
      if (toastKeyRef.current && toastState) {
        // 关闭创建的toast
        toastState.close(toastKeyRef.current.toString());
        toastKeyRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied]); // 没有 toastState 依赖: 从父组件传入, 无需进行显式的依赖。只需记录当前的toastKey保证不重复即可。

  return (
    <>
      <IconButton onClick={copyCurrentUrl}>
        <Icon className={className}>Share</Icon>
      </IconButton>
    </>
  );
}
