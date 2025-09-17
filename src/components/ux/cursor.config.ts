export const cursorConfig = {
  // ...已有配置
  outerSize: 24,
  innerSize: 12,
  outerBorder: 2,
  followAlpha: 0.2,
  bounceScaleOuter: 0.85,
  bounceScaleInner: 1.25,
  bounceDuration: 150,
  shadow: {
    light: "0 1px 2px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.12)",
    dark: "0 1px 2px rgba(0,0,0,.32), 0 2px 6px rgba(0,0,0,.24)",
  },
  colorVar: "--md-sys-color-primary",

  clickRipple: {
    enabled: true,
    // 初始半径与最终半径（相对 outerSize），更靠近 M3 的“快起快收”
    startScale: 0.5, // 初始小一点
    endScale: 4, // 扩散到外圈外一点（unbounded 感）
    duration: 450, // ms（M3 典型 300~500）
    opacity: 0.22, // 半透明，既不过分刺眼又清晰
    colorVar: "--md-sys-color-primary", // Ripple 颜色，默认同 primary
    easing: "cubic-bezier(.2,0,.2,1)", // M3 常用标准缓动
  },
};
