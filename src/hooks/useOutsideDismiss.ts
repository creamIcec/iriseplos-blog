import { RefObject, useEffect } from "react";

export type OutsideDismissOptions = {
  enabled: boolean;
  refs: Array<RefObject<HTMLElement | null>>;
  onDismiss: (event: Event) => void;

  ignore?: (target: EventTarget | null, event: Event) => boolean;

  /** 是否响应 Escape 关闭（默认 true） */
  closeOnEscape?: boolean;
  /** 焦点移出是否关闭：移动端建议 false（默认桌面 true） */
  closeOnFocusOut?: boolean;
  /** 右键是否关闭（默认 true） */
  closeOnRightClick?: boolean;

  /**
   * 关闭判定时机：
   * - 'down'：pointerdown 立即关闭（桌面推荐）
   * - 'up'：pointerup 且移动距离 < touchSlop 才关闭（移动端推荐）
   */
  trigger?: "down" | "up";

  /** 触摸“抖动窗口”，像素；移动端推荐 8~12（默认 10） */
  touchSlop?: number;
};

interface ExtendedFocusEvent extends FocusEvent {
  sourceCapabilities?: {
    firesTouchEvents: boolean;
  };
}

export function useOutsideDismiss({
  enabled,
  refs,
  onDismiss,
  ignore,
  closeOnEscape = true,
  closeOnFocusOut = true,
  closeOnRightClick = true,
  trigger = "up",
  touchSlop = 10,
}: OutsideDismissOptions) {
  useEffect(() => {
    if (!enabled) return;
    const doc = document;

    const isInside = (target: EventTarget | null, path?: EventTarget[]) => {
      for (const r of refs) {
        const el = r.current;
        if (!el) continue;
        if (path && path.length && path.includes(el)) return true; // Shadow DOM
        if (target instanceof Node && el.contains(target)) return true;
      }
      return false;
    };

    let startX = 0,
      startY = 0;
    let canceledByScroll = false;
    let pressedOutside = false;

    const onPointerDown = (e: PointerEvent) => {
      const path = (e.composedPath?.() ?? []) as EventTarget[];
      if (ignore?.(e.target, e)) return;
      if (!closeOnRightClick && e.button === 2) return;

      const outside = !isInside(e.target, path);
      pressedOutside = outside;

      // 记录起点，仅对触摸生效
      if (e.pointerType === "touch") {
        startX = e.clientX;
        startY = e.clientY;
        canceledByScroll = false;

        // 监听 window 的 scroll（本次触摸期间）
        const onScroll = () => {
          canceledByScroll = true;
        };
        window.addEventListener("scroll", onScroll, {
          passive: true,
          once: true,
        });

        // 触摸被系统取消（滚动/来电/切换 app 等）
        const onCancel = () => {
          canceledByScroll = true;
          cleanupMove();
        };
        const onMove = (mv: PointerEvent) => {
          if (
            Math.hypot(mv.clientX - startX, mv.clientY - startY) > touchSlop
          ) {
            canceledByScroll = true;
            cleanupMove();
          }
        };
        const cleanupMove = () => {
          doc.removeEventListener("pointermove", onMove, true);
          doc.removeEventListener("pointercancel", onCancel, true);
        };
        doc.addEventListener("pointermove", onMove, {
          capture: true,
          passive: true,
        });
        doc.addEventListener("pointercancel", onCancel, {
          capture: true,
          passive: true,
        });

        // 在 pointerup 时也清掉上面两个
        const onceUp = () => {
          cleanupMove();
          doc.removeEventListener("pointerup", onceUp, true);
        };
        doc.addEventListener("pointerup", onceUp, {
          capture: true,
          passive: true,
        });
      }

      if (trigger === "down" && outside) {
        onDismiss(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (trigger !== "up") return;
      if (!pressedOutside) return;

      // 触摸：需要满足“没明显拖动/滚动/被取消”
      if (e.pointerType === "touch" && canceledByScroll) return;

      const path = (e.composedPath?.() ?? []) as EventTarget[];
      // 若抬起时已经在内部，则忽略（用户可能拖回了面板）
      if (isInside(e.target, path)) return;

      onDismiss(e);
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!closeOnFocusOut) return;

      // 移动端: 若是触摸引起的焦点变化(软键盘、虚拟点击), 忽略; 此处拓展FocusEvent, 添加多数浏览器在触摸事件上带有的 sourceCapabilities 属性
      // 防止eslint报错。
      const extendedEvent = e as ExtendedFocusEvent;
      // 然后判断有没有
      if (extendedEvent.sourceCapabilities?.firesTouchEvents) return;

      const path = (e.composedPath?.() ?? []) as EventTarget[];
      if (ignore?.(e.target, e)) return;
      if (isInside(e.target, path)) return;

      onDismiss(e);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") onDismiss(e);
    };

    doc.addEventListener("pointerdown", onPointerDown, {
      capture: true,
      passive: true,
    });
    doc.addEventListener("pointerup", onPointerUp, {
      capture: true,
      passive: true,
    });
    if (closeOnFocusOut)
      doc.addEventListener("focusin", onFocusIn, { capture: true });
    if (closeOnEscape)
      doc.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      doc.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      doc.removeEventListener("pointerup", onPointerUp, {
        capture: true,
      });
      if (closeOnFocusOut)
        doc.removeEventListener("focusin", onFocusIn, { capture: true });
      if (closeOnEscape)
        doc.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [
    enabled,
    refs,
    onDismiss,
    ignore,
    closeOnEscape,
    closeOnFocusOut,
    closeOnRightClick,
    trigger,
    touchSlop,
  ]);
}
