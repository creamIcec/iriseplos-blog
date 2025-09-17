"use client";

import type { ToastState } from "@react-stately/toast";
import { Icon, IconButton, SnackbarProvider } from "actify";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Mount = HTMLElement;

export default function CodeToolbarClient() {
  const [mounts, setMounts] = useState<Mount[]>([]);

  useEffect(() => {
    const found = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".markdown-content .m3-pre__copy-mount[data-copy-mount]"
      )
    );
    setMounts(found);
  }, []);

  const renderButton = (mount: Mount) => {
    const pre = mount.closest("pre.m3-pre");
    const code = pre?.querySelector("code");

    const handleCopy = async (state: ToastState<ReactNode>) => {
      if (!code) return;
      const text = (code.textContent ?? "").replace(/\n+$/, "");
      try {
        await navigator.clipboard.writeText(text);
        state?.add("已复制~", { timeout: 1200 });
        const btn = mount.querySelector("button");
        btn?.setAttribute("aria-label", "已复制");
        mount.setAttribute("data-copied", "true");
        setTimeout(() => {
          mount.removeAttribute("data-copied");
          btn?.setAttribute("aria-label", "复制代码");
        }, 1200);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code!);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };

    return createPortal(
      <SnackbarProvider>
        {(state) => (
          <IconButton
            aria-label="复制代码"
            onPress={() => handleCopy(state)}
            className="m3-pre__copy-btn"
            variant="filled-tonal"
          >
            <Icon>
              {mount.getAttribute("data-copied") ? "check" : "content_copy"}
            </Icon>
          </IconButton>
        )}
      </SnackbarProvider>,
      mount
    );
  };

  return (
    <>
      {mounts.map((m, i) => (
        <span key={i}>{renderButton(m)}</span>
      ))}
    </>
  );
}
