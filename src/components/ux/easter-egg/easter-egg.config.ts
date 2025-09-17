// confetti.config.ts
export const confettiConfig = {
  // 粒子基本属性
  count: 180, // 粒子数量
  colors: [
    // 粒子颜色组
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#E74C3C",
    "#D7BDE2",
  ],

  // 发射配置
  spread: 500, // 发射宽度范围
  baseSpeed: { min: 3, max: 9 }, // 基础速度范围

  // 粒子外观
  width: { min: 8, max: 18 }, // 宽度范围
  height: { min: 4, max: 10 }, // 高度范围
  rotationSpeed: { min: -5, max: 5 }, // 旋转速度范围

  // 物理属性
  gravity: { min: 0.07, max: 0.12 }, // 重力范围

  // 生命周期控制
  hoverChance: 0.04, // 悬停阶段转为下落的概率（越大悬停越短）
  topMargin: 30, // 距离顶部多少像素时开始悬停

  // 其他特效
  avatarScaleOnConfetti: 1.05, // 礼花时头像的放大系数
};
