"use client";

import { Button, Card, Icon } from "actify";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

type TimerState = "idle" | "work" | "break" | "longBreak";

interface PomodoroTimerProps {
  className?: string;
  workMin?: number;
  shortBreakMin?: number;
  longBreakMin?: number;
}

export default function PomodoroTimer({
  className,
  workMin = 25,
  shortBreakMin = 5,
  longBreakMin = 15,
}: PomodoroTimerProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(workMin * 60);
  const [cycle, setCycle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // 平滑计时
  const targetTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const presets = useMemo(
    () => ({
      work: workMin * 60,
      break: shortBreakMin * 60,
      longBreak: longBreakMin * 60,
    }),
    [workMin, shortBreakMin, longBreakMin]
  );

  const cfg = {
    ringColor: "var(--md-sys-color-primary-container)",
    timeColor: "var(--md-sys-color-on-surface)",
    idleRing: "var(--md-sys-color-outline-variant)",
    nextAccent: "var(--md-sys-color-tertiary)",
    surfaceSoft: "var(--md-sys-color-surface-container-low)",
    iconOn: "var(--md-sys-color-on-surface)",
  };

  const gotoPhase = (phase: TimerState) => {
    setState(phase);
    const seconds =
      phase === "work"
        ? presets.work
        : phase === "break"
        ? presets.break
        : phase === "longBreak"
        ? presets.longBreak
        : presets.work;
    setTimeLeft(seconds);
    targetTsRef.current = isRunning ? Date.now() + seconds * 1000 : null;
  };

  // 阶段切换
  const completePhase = () => {
    // 触觉反馈 + 小音效
    try {
      if ("vibrate" in navigator) navigator.vibrate?.([160, 60, 160]);
      new Audio("/notification.mp3").play().catch(() => {});
    } catch {}
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🍅 番茄钟", {
        body:
          state === "work" ? "专注结束，休息一下吧～" : "休息结束，继续专注！",
        icon: "/favicon.ico",
      });
    }

    if (state === "work") {
      const next = cycle + 1;
      setCycle(next);
      gotoPhase(next % 4 === 0 ? "longBreak" : "break");
    } else {
      gotoPhase("work");
    }
  };

  /** 启动 / 暂停 / 重置 / 跳过 */
  const start = () => {
    if (state === "idle") gotoPhase("work");
    setIsRunning(true);
    if (!targetTsRef.current)
      targetTsRef.current = Date.now() + timeLeft * 1000;
  };
  const pause = () => {
    setIsRunning(false);
    targetTsRef.current = null; // 暂停即清除目标
  };
  const reset = () => {
    setIsRunning(false);
    setCycle(0);
    setState("idle");
    setTimeLeft(presets.work);
    targetTsRef.current = null;
  };
  const skip = () => completePhase();

  // 1s内多次刷新
  useEffect(() => {
    const tick = () => {
      if (isRunning && targetTsRef.current) {
        const leftMs = Math.max(0, targetTsRef.current - Date.now());
        const left = Math.round(leftMs / 1000);
        setTimeLeft(left);
        if (left <= 0) {
          targetTsRef.current = null;
          setIsRunning(false);
          completePhase();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, state, presets.work, presets.break, presets.longBreak]);

  // 请求通知权限
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const total =
    state === "work"
      ? presets.work
      : state === "break"
      ? presets.break
      : state === "longBreak"
      ? presets.longBreak
      : presets.work;

  const progress = state === "idle" ? 0 : (total - timeLeft) / total;

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  /** 下一阶段提示 */
  const nextText =
    state === "work"
      ? (cycle + 1) % 4 === 0
        ? { t: "15:00", label: "长休息" }
        : { t: "05:00", label: "短休息" }
      : { t: `${String(workMin).padStart(2, "0")}:00`, label: "Focus" };

  /** 圆环参数（尽量靠近你的图：大、粗、圆） */
  const size = 320; // 直径（像素）
  const stroke = 14; // 描边粗细
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dashOffset = C * (1 - progress);

  return (
    <Card
      className={clsx(
        "relative overflow-hidden",
        "px-6 pt-8 pb-10 md:px-10 md:pt-10",
        "bg-surface",
        className
      )}
    >
      <div className="text-center mb-6 md:mb-10">
        <h1
          className="font-extrabold tracking-wide text-on-surface"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
          }}
        >
          专注时段
        </h1>
      </div>

      <div className="flex items-center justify-center mb-8 md:mb-12">
        <div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            boxShadow: "inset 0 0 0 0px var(--md-sys-color-surface)",
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={state === "idle" ? cfg.idleRing : cfg.ringColor}
              strokeWidth={stroke}
              opacity={0.4}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={cfg.ringColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke-dashoffset 250ms linear",
                filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.04))",
              }}
            />
          </svg>

          <div
            className="absolute inset-0 flex items-center mb-32 justify-center"
            style={{ color: cfg.timeColor }}
          >
            <div
              className="font-black"
              style={{
                fontSize: "clamp(48px, 12vw, 88px)",
                letterSpacing: "0.02em",
              }}
              aria-live="polite"
            >
              {minutes}:{seconds}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-10">
        <Button
          variant="filled"
          onClick={isRunning ? () => pause() : () => start()}
          className="h-20 w-32 px-10 rounded-[28px] shadow-sm"
        >
          <Icon slot="icon" style={{ color: cfg.iconOn }}>
            {isRunning ? "pause" : "play_arrow"}
          </Icon>
        </Button>

        <Button
          onClick={reset}
          variant="tonal"
          aria-label="重置"
          className="h-20 w-24"
        >
          <Icon>restart_alt</Icon>
        </Button>

        <Button
          variant="tonal"
          onClick={skip}
          aria-label="跳过"
          className="h-20 w-16 px-10 rounded-[28px] shadow-sm"
        >
          <Icon slot="icon" style={{ color: cfg.iconOn }}>
            skip_next
          </Icon>
        </Button>
      </div>

      <div className="text-center">
        <div className="text-label-large font-bold mb-1 text-on-surface">
          下一阶段
        </div>
        <div
          className="font-extrabold leading-none"
          style={{
            color: cfg.nextAccent,
            fontSize: "clamp(26px, 4.8vw, 34px)",
          }}
        >
          {nextText.t}
        </div>
        <div
          className="text-title-medium font-extrabold"
          style={{ color: "var(--md-sys-color-on-surface)" }}
        >
          {nextText.label}
        </div>
      </div>
    </Card>
  );
}
