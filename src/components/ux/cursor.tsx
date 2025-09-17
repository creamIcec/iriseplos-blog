"use client";
import { useEffect, useRef, useState } from "react";
import { cursorConfig as cfg } from "./cursor.config";

const INTERACTIVE_SELECTORS =
  'a, button, input, textarea, select, [role="button"], [role="link"], [contenteditable=""], [contenteditable="true"]';

function isInteractive(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_SELECTORS) !== null;
}

export default function Cursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const pos = useRef({ x: -9999, y: -9999 });
  const outerPos = useRef({ x: -9999, y: -9999 });

  const outerScale = useRef(1);
  const innerScale = useRef(1);
  const bounceTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    const onEnter = () => setVisible(true);
    const onLeave = () => {
      setVisible(false);
      root.classList.remove("hide-cursor");
    };

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      const overInteractive = isInteractive(e.target);
      if (overInteractive) {
        setVisible(false);
        root.classList.remove("hide-cursor");
      } else {
        setVisible(true);
        root.classList.add("hide-cursor");
      }

      // 移动弹性缩放
      outerScale.current = cfg.bounceScaleOuter;
      innerScale.current = cfg.bounceScaleInner;
      if (bounceTimer.current) window.clearTimeout(bounceTimer.current);
      bounceTimer.current = window.setTimeout(() => {
        outerScale.current = 1;
        innerScale.current = 1;
      }, cfg.bounceDuration);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!cfg.clickRipple.enabled || !outerRef.current) return;
      // 只在“自定义光标可见且生效”时触发（避免输入框/按钮上误触）
      if (!visible) return;

      // 在外圈里放一个一次性 ripple
      const ripple = document.createElement("span");
      ripple.setAttribute("aria-hidden", "true");
      Object.assign(ripple.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: `${cfg.outerSize}px`,
        height: `${cfg.outerSize}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "9999px",
        pointerEvents: "none",
        backgroundColor: `var(${cfg.clickRipple.colorVar})`,
        opacity: String(cfg.clickRipple.opacity),
        // 动画参数通过 CSS 变量传递，便于统一控制
        animation: `cursor-ripple-enter ${cfg.clickRipple.duration}ms ${cfg.clickRipple.easing} forwards`,
        // 为关键帧提供参数
        "--ripple-start": String(cfg.clickRipple.startScale),
        "--ripple-end": String(cfg.clickRipple.endScale),
        "--ripple-opacity": String(cfg.clickRipple.opacity),
        mixBlendMode: "normal", // 如需更强对比可改 'plus-lighter' 或 'difference'
        filter: "blur(0.2px)", // 细微柔化边缘
      });

      outerRef.current.appendChild(ripple);
      // 动画结束后移除
      ripple.addEventListener(
        "animationend",
        () => {
          ripple.remove();
        },
        { once: true }
      );
    };

    const loop = () => {
      // Lerp 外圈位置
      outerPos.current.x +=
        (pos.current.x - outerPos.current.x) * cfg.followAlpha;
      outerPos.current.y +=
        (pos.current.y - outerPos.current.y) * cfg.followAlpha;

      if (outerRef.current) {
        outerRef.current.style.transform =
          `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)` +
          ` translate(-50%, -50%) scale(${outerScale.current})`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)` +
          ` translate(-50%, -50%) scale(${innerScale.current})`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    loop();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
      root.classList.remove("hide-cursor");
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  return (
    <>
      {/* 外圈 */}
      <div
        ref={outerRef}
        aria-hidden
        className={[
          "pointer-events-none fixed z-[9999] rounded-full",
          "transition-[transform,opacity] duration-200 ease-[cubic-bezier(.22,1,.36,1)]",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{
          left: 0,
          top: 0,
          height: cfg.outerSize,
          width: cfg.outerSize,
          borderWidth: cfg.outerBorder,
          borderStyle: "solid",
          borderColor: `var(${cfg.colorVar})`,
          backgroundColor: "transparent",
          boxShadow: `var(--md-sys-elevation-1, ${cfg.shadow.light})`,
          transformOrigin: "center",
          willChange: "transform",
          overflow: "visible", // 让 unbounded ripple 可以略超出
        }}
      />
      {/* 内圈 */}
      <div
        ref={innerRef}
        aria-hidden
        className={[
          "pointer-events-none fixed z-[10000] rounded-full",
          "ring-1 ring-white/40 drop-shadow-[0_0_4px_rgba(0,0,0,0.35)]",
          "transition-opacity duration-150 ease-out",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{
          left: 0,
          top: 0,
          height: cfg.innerSize,
          width: cfg.innerSize,
          backgroundColor: `var(${cfg.colorVar})`,
          transformOrigin: "center",
          willChange: "transform",
        }}
      />
    </>
  );
}
