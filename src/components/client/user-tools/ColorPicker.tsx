"use client";

import { changeColor } from "@/utils/theme";
import {
  Button,
  Card,
  Icon,
  IconButton,
  Slider,
  SnackbarProvider,
  TextField,
} from "actify";
import clsx from "clsx";
import * as React from "react";
import { useMemo } from "react";

import { themeFromSourceColor } from "@/utils/material-color-helpers";

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): RGB | null {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
function rgbToHex({ r, g, b }: RGB) {
  const to2 = (x: number) =>
    clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}
function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case R:
        h = ((G - B) / d) % 6;
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      case B:
        h = (R - G) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb({ h, s, l }: HSL): RGB {
  const H = ((h % 360) + 360) % 360;
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - C / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= H && H < 60) [r, g, b] = [C, X, 0];
  else if (60 <= H && H < 120) [r, g, b] = [X, C, 0];
  else if (120 <= H && H < 180) [r, g, b] = [0, C, X];
  else if (180 <= H && H < 240) [r, g, b] = [0, X, C];
  else if (240 <= H && H < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function withAlphaHex(hex: string, alpha01: number) {
  const a = clamp(Math.round(alpha01 * 255), 0, 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`.toUpperCase();
}

function toCssRgb(rgb: RGB, a = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a
    .toFixed(3)
    .replace(/\.?0+$/, "")})`;
}
function toCssHsl(hsl: HSL, a = 1) {
  return `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(
    hsl.l
  )}%, ${a.toFixed(3).replace(/\.?0+$/, "")})`;
}

const TONAL_STOPS = [95, 90, 80, 70, 60, 50, 40, 30, 20]; // 从极浅到较深
function buildTonalPalette(hsl: HSL) {
  return TONAL_STOPS.map((L) => ({ ...hsl, l: L }));
}

interface ColorPickerProps {
  className?: string;
}

export default function ColorPicker({ className }: ColorPickerProps) {
  const [hex, setHex] = React.useState<string>("#6750A4"); // M3 经典紫
  const [alpha, setAlpha] = React.useState<number>(1); // 0..1

  // 从 hex 推导 rgb/hsl
  const rgb = React.useMemo(
    () => hexToRgb(hex) ?? { r: 103, g: 80, b: 164 },
    [hex]
  );
  const hsl = React.useMemo(() => rgbToHsl(rgb), [rgb]);

  // 输入联动：H / S / L 滑块修改 -> 反推 hex
  const setHsl = (next: Partial<HSL>) => {
    const merged = { ...hsl, ...next };
    const toRgb = hslToRgb(merged);
    setHex(rgbToHex(toRgb));
  };

  const copy = async (text: string, toast: (msg: string) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制");
    } catch {
      toast("复制失败");
    }
  };

  const cssExport = useMemo(() => {
    const theme = themeFromSourceColor(hex, false); // false = light theme
    let str = ":root,\n:host {\n";
    for (const [key, value] of Object.entries(theme)) {
      str += `  --md-sys-color-${key}: ${value};\n`;
    }
    str += "}";
    return str;
  }, [hex]);

  const tonal = React.useMemo(() => buildTonalPalette(hsl), [hsl]);

  return (
    <SnackbarProvider>
      {(toastApi) => {
        const toast = (msg: string) => toastApi.add(msg, { timeout: 1200 });

        return (
          <Card className={clsx("p-4 md:p-6 space-y-4", className)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconButton
                  aria-label="复制 CSS 变量"
                  onPress={() => copy(cssExport, toast)}
                  variant="filled"
                >
                  <Icon>content_copy</Icon>
                </IconButton>
                <IconButton
                  aria-label="应用为站点主题色(primary 等)"
                  onPress={() => {
                    changeColor(hex);
                    toast("已应用到主题");
                  }}
                  variant="filled-tonal"
                >
                  <Icon>palette</Icon>
                </IconButton>
              </div>
            </div>

            {/* 上半：大色块 + 原生取色器 + HEX/Alpha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                {/* 大圆色块 */}
                <div
                  className="size-24 rounded-full border border-outline-variant shadow-sm shrink-0"
                  style={{ background: toCssRgb(rgb, alpha) }}
                  aria-label="当前颜色预览"
                />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      aria-label="取色器"
                      type="color"
                      value={hex}
                      onChange={(e) => setHex(e.target.value.toUpperCase())}
                      className="h-10 w-16 rounded cursor-pointer bg-transparent border border-outline-variant"
                    />
                    <TextField
                      label="HEX"
                      value={hex}
                      onChange={(v: string) => {
                        const vv = v.startsWith("#") ? v : `#${v}`;
                        setHex(vv.toUpperCase());
                      }}
                    />
                    <Button onPress={() => copy(hex, toast)} variant="text">
                      <Icon>content_copy</Icon>复制
                    </Button>
                  </div>
                  <div>
                    <TextField
                      label="Alpha 0–1"
                      value={alpha.toString()}
                      onChange={(v: string) =>
                        setAlpha(clamp(Number(v) || 0, 0, 1))
                      }
                    />
                  </div>
                  <div className="flex items-center">
                    <Slider
                      aria-label="Alpha"
                      minValue={0}
                      maxValue={1}
                      step={0.01}
                      value={alpha}
                      onChange={(value: any) => setAlpha(value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 右侧：RGB / HSL */}
              <div className="grid grid-cols-3 gap-3">
                <TextField
                  label="R"
                  value={rgb.r.toString()}
                  onChange={(v: string) => {
                    const r = clamp(parseInt(v || "0"), 0, 255);
                    setHex(rgbToHex({ r, g: rgb.g, b: rgb.b }));
                  }}
                />
                <TextField
                  label="G"
                  value={rgb.g.toString()}
                  onChange={(v: string) => {
                    const g = clamp(parseInt(v || "0"), 0, 255);
                    setHex(rgbToHex({ r: rgb.r, g, b: rgb.b }));
                  }}
                />
                <TextField
                  label="B"
                  value={rgb.b.toString()}
                  onChange={(v: string) => {
                    const b = clamp(parseInt(v || "0"), 0, 255);
                    setHex(rgbToHex({ r: rgb.r, g: rgb.g, b }));
                  }}
                />

                <div className="col-span-3 h-[1px] bg-outline-variant/40 my-1" />

                <TextField
                  label="H (0–360)"
                  value={Math.round(hsl.h).toString()}
                  onChange={(v: string) =>
                    setHsl({ h: clamp(parseFloat(v || "0"), 0, 360) })
                  }
                />
                <TextField
                  label="S (0–100)"
                  value={Math.round(hsl.s).toString()}
                  onChange={(v: string) =>
                    setHsl({ s: clamp(parseFloat(v || "0"), 0, 100) })
                  }
                />
                <TextField
                  label="L (0–100)"
                  value={Math.round(hsl.l).toString()}
                  onChange={(v: string) =>
                    setHsl({ l: clamp(parseFloat(v || "0"), 0, 100) })
                  }
                />

                <div className="col-span-3 flex items-center gap-3 mt-2">
                  <span className="text-label-medium text-on-surface-variant">
                    滑块微调
                  </span>
                </div>
                <div className="col-span-3 grid gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right">H</span>
                    <Slider
                      minValue={0}
                      maxValue={360}
                      step={1}
                      value={hsl.h}
                      onChange={(v) => setHsl({ h: v as number })}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right">S</span>
                    <Slider
                      minValue={0}
                      maxValue={100}
                      step={1}
                      value={hsl.s}
                      onChange={(v) => setHsl({ s: v as number })}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right">L</span>
                    <Slider
                      minValue={0}
                      maxValue={100}
                      step={1}
                      value={hsl.l}
                      onChange={(v) => setHsl({ l: v as number })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 导出行 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-title-medium">当前格式</h4>
                  <Button
                    onPress={() => copy(toCssRgb(rgb, alpha), toast)}
                    variant="text"
                  >
                    <Icon>content_copy</Icon>复制 RGBA
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-body-medium">
                  <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline-variant/40">
                    <div className="text-on-surface-variant">HEX</div>
                    <code className="break-all">{hex}</code>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline-variant/40">
                    <div className="text-on-surface-variant">HEX+A</div>
                    <code className="break-all">
                      {withAlphaHex(hex, alpha)}
                    </code>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline-variant/40">
                    <div className="text-on-surface-variant">RGBA</div>
                    <code className="break-all">{toCssRgb(rgb, alpha)}</code>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline-variant/40">
                    <div className="text-on-surface-variant">HSLA</div>
                    <code className="break-all">{toCssHsl(hsl, alpha)}</code>
                  </div>
                </div>
              </div>

              {/* Tonal-like 阶 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-title-medium">Tonal 阶（HSL 近似）</h4>
                  <Button
                    onPress={() => {
                      const lines = tonal
                        .map(
                          (t, i) =>
                            `--tone-${TONAL_STOPS[i]}: ${rgbToHex(
                              hslToRgb(t)
                            )};`
                        )
                        .join("\n");
                      copy(lines, toast);
                    }}
                    variant="text"
                  >
                    <Icon>content_copy</Icon>复制全部
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tonal.map((t, i) => {
                    const c = hslToRgb(t);
                    const hx = rgbToHex(c);
                    return (
                      <button
                        key={i}
                        title={`${TONAL_STOPS[i]} • ${hx}`}
                        aria-label={`${TONAL_STOPS[i]} • ${hx}`}
                        onClick={() => {
                          setHex(hx);
                          toast(`已选 ${hx}`);
                        }}
                        className="rounded-xl border border-outline-variant/60 p-2 flex items-center gap-2 hover:scale-105 transition"
                      >
                        <span
                          className="size-6 rounded-md border border-outline-variant/50"
                          style={{ background: rgbToHex(c) }}
                        />
                        <span className="text-label-medium">
                          {TONAL_STOPS[i]}
                        </span>
                        <code className="text-body-small text-on-surface-variant">
                          {hx}
                        </code>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CSS 导出块 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-title-medium">导出为 CSS 变量</h4>
                <Button onPress={() => copy(cssExport, toast)} variant="filled">
                  <Icon>content_copy</Icon>复制
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-surface-variant/30 border border-outline-variant/40 overflow-auto text-body-small">
                {cssExport}
              </pre>
            </div>
          </Card>
        );
      }}
    </SnackbarProvider>
  );
}
