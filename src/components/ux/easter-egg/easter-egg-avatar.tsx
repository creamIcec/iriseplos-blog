"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { confettiConfig } from "./easter-egg.config";
import clsx from "clsx";
import { useEasterEggStore } from "@/lib/store/easter-egg-store";
import { FocusRing } from "actify";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  shape: number;
  gravity: number;
  life: number; // 0-上升，1-悬停，2-下落
  alpha: number;
  maxHeight: number; // 控制粒子能飞多高
}

interface EasterEggAvatarProps {
  className?: string;
}

export default function EasterEggAvatar({ className }: EasterEggAvatarProps) {
  const [showFireworks, setShowFireworks] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const [isFocused, setIsFocused] = useState(false);

  const { rotation, setRotation, resetRotation } = useEasterEggStore();

  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 完全清屏，不留尾迹
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新和渲染所有粒子
    let stillActive = false;

    particlesRef.current.forEach((particle) => {
      // 粒子生命周期状态管理
      if (particle.life === 0) {
        // 上升阶段
        particle.vy += particle.gravity * 0.6;

        // 到达屏幕顶部附近或速度变慢时转为悬停
        if (particle.y <= particle.maxHeight || particle.vy >= -0.3) {
          particle.life = 1; // 转为悬停状态
          particle.vy = (Math.random() - 0.5) * 0.7; // 微弱上下浮动
        }
      } else if (particle.life === 1) {
        // 悬停阶段
        // 随机变化方向，呈现飘浮感
        particle.vx += (Math.random() - 0.5) * 0.1;
        particle.vy += (Math.random() - 0.5) * 0.1;

        // 限制速度
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // 悬停后快速下落（增加了转为下落的概率）
        if (Math.random() < confettiConfig.hoverChance) {
          particle.life = 2; // 转为下落状态
        }
      } else if (particle.life === 2) {
        // 下落阶段
        // 加速下落
        particle.vy += particle.gravity;
        // 空气阻力
        particle.vx *= 0.99;
      }

      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 更新旋转
      particle.rotation += particle.rotationSpeed;

      // 渲染粒子
      renderParticle(ctx, particle);

      // 判断是否仍有活跃粒子
      if (particle.y < canvas.height + 50) {
        stillActive = true;
      }
    });

    // 结束动画或继续
    if (stillActive) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setShowFireworks(false);
    }
  }, []);

  // 初始化Canvas
  useEffect(() => {
    if (showFireworks) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 设置Canvas为全屏
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 创建粒子
      particlesRef.current = createParticles();

      // 开始动画
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showFireworks, animate]);

  // 创建粒子群
  const createParticles = () => {
    const particles: Particle[] = [];
    const centerX = window.innerWidth / 2;
    const bottomY = window.innerHeight;
    const count = confettiConfig.count;
    const topArea = confettiConfig.topMargin;

    for (let i = 0; i < count; i++) {
      // 从底部中心区域发射
      const spreadX = (Math.random() - 0.5) * confettiConfig.spread;
      const offsetFromCenter = Math.abs(spreadX) / (confettiConfig.spread / 2);

      // 发射速度和角度
      const speedRange = confettiConfig.baseSpeed;
      const baseSpeed =
        speedRange.min + Math.random() * (speedRange.max - speedRange.min);
      const angleVariation = (Math.random() - 0.5) * 0.5;
      const launchAngle = Math.PI / 2 - offsetFromCenter * 0.6 + angleVariation;

      // 最大高度（确保能到达屏幕顶部）
      const maxHeight = Math.random() * topArea;

      particles.push({
        x: centerX + spreadX,
        y: bottomY,
        vx: Math.cos(launchAngle) * baseSpeed * (0.8 + Math.random() * 0.4),
        vy: -Math.sin(launchAngle) * baseSpeed * (0.8 + Math.random() * 0.4),
        color:
          confettiConfig.colors[
            Math.floor(Math.random() * confettiConfig.colors.length)
          ],
        width:
          confettiConfig.width.min +
          Math.random() * (confettiConfig.width.max - confettiConfig.width.min),
        height:
          confettiConfig.height.min +
          Math.random() *
            (confettiConfig.height.max - confettiConfig.height.min),
        rotation: Math.random() * 360,
        rotationSpeed:
          confettiConfig.rotationSpeed.min +
          Math.random() *
            (confettiConfig.rotationSpeed.max -
              confettiConfig.rotationSpeed.min),
        shape: Math.floor(Math.random() * 3),
        gravity:
          confettiConfig.gravity.min +
          Math.random() *
            (confettiConfig.gravity.max - confettiConfig.gravity.min),
        life: 0,
        alpha: 0.9 + Math.random() * 0.1,
        maxHeight: maxHeight,
      });
    }

    return particles;
  };

  // 渲染纸屑粒子（三种不同的平行四边形）
  const renderParticle = (
    ctx: CanvasRenderingContext2D,
    particle: Particle
  ) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.alpha;

    // 三种不同的平行四边形
    switch (particle.shape) {
      case 0: // 普通矩形
        ctx.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height
        );
        break;
      case 1: // 右斜平行四边形
        ctx.beginPath();
        ctx.moveTo(-particle.width / 2, -particle.height / 2);
        ctx.lineTo(particle.width / 2, -particle.height / 2);
        ctx.lineTo(
          particle.width / 2 - particle.height / 2,
          particle.height / 2
        );
        ctx.lineTo(
          -particle.width / 2 - particle.height / 2,
          particle.height / 2
        );
        ctx.closePath();
        ctx.fill();
        break;
      case 2: // 左斜平行四边形
        ctx.beginPath();
        ctx.moveTo(-particle.width / 2, -particle.height / 2);
        ctx.lineTo(particle.width / 2, -particle.height / 2);
        ctx.lineTo(
          particle.width / 2 + particle.height / 2,
          particle.height / 2
        );
        ctx.lineTo(
          -particle.width / 2 + particle.height / 2,
          particle.height / 2
        );
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  const triggerFireworks = useCallback(() => {
    if (showFireworks) return;
    setShowFireworks(true);
  }, [showFireworks]);

  const handleClick = () => {
    const newDeg = rotation + 15;
    setRotation(newDeg);

    // 检查是否完成一圈
    if (newDeg % 360 === 0 && newDeg > 0) {
      triggerFireworks();
      resetRotation();
    }
  };

  return (
    <div
      className={clsx("relative rounded-full cursor-pointer", className)}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      role="button"
    >
      {isFocused && <FocusRing className="outline-primary-container!" />}
      <Image
        src="/avatar/Apryes.jpg"
        alt="avatar"
        width={128}
        height={128}
        className={`rounded-full cursor-pointer transition-transform duration-300 ${
          showFireworks ? "scale-110" : "hover:scale-105"
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          position: "relative",
          zIndex: 10,
          transition: "transform 0.3s ease-in-out",
          ...(showFireworks && {
            transform: `rotate(${rotation}deg) scale(${confettiConfig.avatarScaleOnConfetti})`,
          }),
        }}
        onClick={handleClick}
      />
      {showFireworks && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}
