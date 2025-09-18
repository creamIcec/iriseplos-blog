"use client";

import { ReactNode, useEffect, useId, useState } from "react";

interface CoverProps {
  children?: ReactNode;
  /** 是否启用底部波浪蒙版 */
  waveMask?: boolean;
  /** 是否让波浪动起来（默认 false 先静态） */
  animateWave?: boolean;
  /** 波浪作用的垂直高度（px） */
  waveHeight?: number;
  /** 波峰/波谷幅度（px） */
  waveAmplitude?: number;
  /** 一个周期的水平长度（px） */
  waveLength?: number;
  /** 动画周期（秒） */
  waveSpeedSec?: number;
  /** 图片地址 */
  src?: string;
  /** alt 文本 */
  alt?: string;
  /** 是否在上半部分加淡淡遮罩，不影响底部波浪（默认 false） */
  dimTop?: boolean;
  /** 上半部分遮罩的不透明度（0~1） */
  dimOpacity?: number;
}

export default function Cover({
  children,
  waveMask = true,
  animateWave = false,
  waveHeight = 300,
  waveAmplitude = 20,
  waveLength = 100,
  waveSpeedSec = 12,
  src = "/cover/default-cover.webp",
  dimTop = false,
  dimOpacity = 0.4,
}: CoverProps) {
  const [, setMounted] = useState(false);
  const uid = useId(); // 唯一 id，防止多实例冲突
  useEffect(() => setMounted(true), []);

  // —— 重点：真正“有峰也有谷”的波形 —— //
  // 思路：让路径经过 mid（中线），控制点一次在上，一次在下：
  // M 0,mid
  // Q L/4,mid-A  L/2,mid
  // Q 3L/4,mid+A L,mid
  // 然后向下闭合到底部，形成一个“波浪上边缘” + “到底部”的封闭形状（黑色 = 隐藏）。
  const makeWaveD = (L: number, H: number, A: number) => {
    const mid = H / 2;
    return `
      M 0,${mid}
      Q ${L / 4},${mid - A} ${L / 2},${mid}
      Q ${(3 * L) / 4},${mid + A} ${L},${mid}
      L ${L},${H}
      L 0,${H}
      Z
    `.trim();
  };

  const maskId = `mask-${uid}`;
  const tileId = `tile-${uid}`;

  return (
    <div className="relative w-full h-140 md:h-160 rounded-b-4xl overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* 1 个波长的波浪块，用来横向平铺 */}
          <pattern
            id={tileId}
            patternUnits="userSpaceOnUse"
            width={waveLength}
            height={waveHeight}
          >
            {/* 黑色 = 隐藏（把“波浪线以下到底部”的区域涂黑） */}
            <path
              d={makeWaveD(waveLength, waveHeight, waveAmplitude)}
              fill="black"
            />
          </pattern>

          {/* 最终 mask：先白底（全显），再在底部叠加“黑色波浪块平铺”来隐藏 */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1920" height="1080" fill="white" />
            <g
              transform={`translate(0, ${1080 - waveHeight})`}
              style={
                animateWave
                  ? ({
                      animation: `wave-slide-${uid} ${waveSpeedSec}s linear infinite`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {/* 横向拉到很宽，确保任何容器宽度都覆盖到 */}
              <rect
                x="-4000"
                y="0"
                width="10000"
                height={waveHeight}
                fill={`url(#${tileId})`}
              />
            </g>
          </mask>
        </defs>

        {/* 图片直接套 mask：白显黑隐；底部“黑色波浪块”把图像挖掉，露出背景 */}
        <image
          href={src}
          width="1920"
          height="1080"
          preserveAspectRatio="xMidYMid slice"
          mask={waveMask ? `url(#${maskId})` : undefined}
        />

        {/* 可选：仅“上半部分”加一层淡淡的黑色遮罩，不影响底部波浪露出背景 */}
        {dimTop && (
          <rect
            x="0"
            y="0"
            width="1920"
            height={1080 - waveHeight}
            fill={`rgba(0,0,0,${Math.max(0, Math.min(1, dimOpacity))})`}
          />
        )}
      </svg>

      {children}

      {/* 动画关键帧：把平铺的波浪块向左移动一个波长，看起来就是从左往右流动 */}
      <style jsx>{`
        @keyframes wave-slide-${uid} {
          0% {
            transform: translate(0, ${1080 - waveHeight}px);
          }
          100% {
            transform: translate(-${waveLength}px, ${1080 - waveHeight}px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          svg [style*="animation"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
