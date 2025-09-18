"use client";

import { Card } from "actify";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

// 输入数据类型：YYYY-MM-DD -> 当天更新次数
export type ActivityMap = Record<string, number>;

type Props = {
  data?: ActivityMap;
  endDate?: Date; // 结束日期(含), 默认今天
  weeks?: number; // 展示多少周
  weekStartsOn?: 0 | 1; // 0=周日开头, 1=周一
  levels?: number[]; // 分级阈值(从低到高), 默认 [0,1,3,6,10]
  className?: string;
  title?: string; // 卡片标题
  onTileClick?: (date: string, count: number) => void;
  /** 可选：强制方向。默认自动：< md 为 vertical，≥ md 为 horizontal */
  orientation?: "horizontal" | "vertical";
};

// YYYY-MM-DD
function fmt(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 生成 [start..end] 的所有日期
function daysBetween(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// 找到某日期所在周的周起始
function startOfWeek(d: Date, weekStartsOn: 0 | 1) {
  const tmp = new Date(d);
  const day = tmp.getDay(); // 0..6 (Sun..Sat)
  const diff = (day - weekStartsOn + 7) % 7;
  tmp.setDate(tmp.getDate() - diff);
  tmp.setHours(0, 0, 0, 0);
  return tmp;
}

function getMonthShortName(m: number) {
  return [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m];
}

function bucketLevel(count: number, levels: number[]) {
  // levels: [0,1,3,6,10] -> 返回 0..levels.length
  // 0 表示无贡献(或 0), 最高为 levels.length
  let i = 0;
  while (i < levels.length && count > levels[i]) i++;
  return i; // 0..n
}

const levelClasses = [
  // 0
  "bg-outline-variant/30", // 空 or very low
  // 1
  "bg-primary/25",
  // 2
  "bg-primary/45",
  // 3
  "bg-primary/65",
  // 4+
  "bg-primary/85",
];

// 简单的媒体查询 Hook
function useIsMdUp() {
  const [isMdUp, setIsMdUp] = useState<boolean | null>(null); // null: 未知（首屏SSR）
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = () => setIsMdUp(mql.matches);
    handler();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);
  return isMdUp;
}

export default function ActivityWall({
  data,
  endDate = new Date(),
  weeks = 53,
  weekStartsOn = 0,
  levels = [0, 1, 3, 6, 10],
  className,
  title = "博客更新状态",
  onTileClick,
  orientation, // 可选强制覆盖
}: Props) {
  // 自动方向（默认：md 以下竖直，md 及以上横向）
  const isMdUp = useIsMdUp();
  const autoOrientation: "horizontal" | "vertical" =
    orientation ??
    (isMdUp == null ? "horizontal" : isMdUp ? "horizontal" : "vertical");

  // 计算时间范围: 以 endDate 所在周的周起为右端对齐, 向左推周次
  const endWeekStart = useMemo(
    () => startOfWeek(endDate, weekStartsOn),
    [endDate, weekStartsOn]
  );
  const start = useMemo(() => {
    const s = new Date(endWeekStart);
    s.setDate(s.getDate() - (weeks - 1) * 7);
    return s;
  }, [endWeekStart, weeks]);

  // 按周切列（横向模式下的列；纵向模式我们仍沿用这个数据结构——每周7天）
  const columns = useMemo(() => {
    const cols: { weekStart: Date; days: Date[] }[] = [];
    for (let w = 0; w < weeks; w++) {
      const colStart = new Date(start);
      colStart.setDate(colStart.getDate() + w * 7);
      const colDays = daysBetween(
        colStart,
        new Date(
          colStart.getFullYear(),
          colStart.getMonth(),
          colStart.getDate() + 6
        )
      );
      cols.push({ weekStart: colStart, days: colDays });
    }
    return cols;
  }, [start, weeks]);

  // 月份标签（按“周起始”的月份计算）
  const monthLabels = useMemo(
    () =>
      columns.map((c, i) => {
        const m = c.weekStart.getMonth();
        const show = i === 0 || m !== columns[i - 1].weekStart.getMonth();
        return { index: i, label: show ? getMonthShortName(m) : "" };
      }),
    [columns]
  );

  const TILE = 16; // 每个小方块边长 px
  const GAP = autoOrientation == "horizontal" ? 4 : 12; // 小方块间距 px

  return (
    <Card className={clsx("overflow-auto", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-3xl text-primary">{title}</h3>
        {/* 桌面图例 */}
        <div className="hidden md:flex items-center gap-2 text-label-medium text-on-surface-variant">
          <span>少</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span
                key={lvl}
                aria-hidden
                className={clsx(
                  "h-3 w-3 rounded-sm border border-outline-variant/60",
                  levelClasses[Math.min(lvl, levelClasses.length - 1)]
                )}
              />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>
      {data ? (
        <>
          {/* 主体：根据方向切换两套网格布局 */}
          {autoOrientation === "horizontal" ? (
            <div
              className="grid"
              suppressHydrationWarning
              style={{
                gridTemplateColumns: `auto 1fr`,
                gridTemplateRows: `auto auto`,
                columnGap: 8,
                rowGap: 8,
                // 让主网格横向滚动时保持整体宽度
                minWidth: weeks * (TILE + GAP) + 40,
              }}
            >
              {/* 月份标签行（row 1, col 2） */}
              <div
                style={{
                  gridColumn: "2 / 3",
                  gridRow: "1 / 2",
                  display: "grid",
                  gridTemplateColumns: `repeat(${weeks}, ${TILE}px)`,
                  columnGap: `${GAP}px`,
                }}
                className="text-label-small text-on-surface-variant"
              >
                {monthLabels.map(({ index, label }) => (
                  <div key={index} className="h-5 flex items-end">
                    <span className="translate-x-[2px]">{label}</span>
                  </div>
                ))}
              </div>

              {/* 星期列（row 2, col 1） */}
              <div
                style={{
                  gridColumn: "1 / 2",
                  gridRow: "2 / 3",
                  display: "grid",
                  gridTemplateRows: `repeat(7, ${TILE}px)`,
                  rowGap: `${GAP}px`,
                  alignContent: "start",
                }}
                className="hidden md:grid text-label-small text-on-surface-variant select-none"
              >
                {(weekStartsOn === 0
                  ? ["", "Mon", "", "Wed", "", "Fri", ""]
                  : ["Mon", "", "Wed", "", "Fri", "", ""]
                ).map((d, i) => (
                  <span key={i} className="leading-3 flex items-center h-full">
                    {d}
                  </span>
                ))}
              </div>

              {/* 主热力网格（row 2, col 2） */}
              <div
                style={{
                  gridColumn: "2 / 3",
                  gridRow: "2 / 3",
                  display: "grid",
                  gridTemplateColumns: `repeat(${weeks}, ${TILE}px)`,
                  columnGap: `${GAP}px`,
                }}
              >
                {columns.map((col, ci) => (
                  <div
                    key={ci}
                    style={{
                      display: "grid",
                      gridTemplateRows: `repeat(7, ${TILE}px)`,
                      rowGap: `${GAP}px`,
                    }}
                  >
                    {col.days.map((day, ri) =>
                      renderTile(
                        day,
                        ri,
                        data,
                        levels,
                        endDate,
                        onTileClick,
                        TILE
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // vertical：星期轴在上、月份轴在左，网格按周为行、天为列
            <div
              className="grid"
              suppressHydrationWarning
              style={{
                gridTemplateRows: `auto 1fr`,
                gridTemplateColumns: `auto 1fr`,
                columnGap: 8,
                rowGap: 8,
                // 让主网格纵向滚动时保持整体高度
                minHeight: weeks * (TILE + GAP) + 40,
              }}
            >
              {/* 星期行（row 1, col 2） */}
              <div
                style={{
                  gridColumn: "2 / 3",
                  gridRow: "1 / 2",
                  display: "grid",
                  gridTemplateColumns: `repeat(7, ${TILE}px)`,
                  columnGap: `${GAP}px`,
                }}
                className="text-label-small text-on-surface-variant select-none"
              >
                {(weekStartsOn === 0
                  ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                  : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                ).map((d, i) => (
                  <span key={i} className="w-full text-center">
                    {d}
                  </span>
                ))}
              </div>

              {/* 月份列（row 2, col 1） */}
              <div
                style={{
                  gridColumn: "1 / 2",
                  gridRow: "2 / 3",
                  display: "grid",
                  gridTemplateRows: `repeat(${weeks}, ${TILE}px)`,
                  rowGap: `${GAP}px`,
                }}
                className="text-label-small text-on-surface-variant select-none"
              >
                {columns.map((c, i) => {
                  const m = c.weekStart.getMonth();
                  const show =
                    i === 0 || m !== columns[i - 1].weekStart.getMonth();
                  return (
                    <span key={i} className="leading-3 flex items-center">
                      {show ? getMonthShortName(m) : ""}
                    </span>
                  );
                })}
              </div>

              {/* 主热力网格（row 2, col 2） */}
              <div
                style={{
                  gridColumn: "2 / 3",
                  gridRow: "2 / 3",
                  display: "grid",
                  gridTemplateRows: `repeat(${weeks}, ${TILE}px)`,
                  rowGap: `${GAP}px`,
                }}
              >
                {columns.map((col, ci) => (
                  <div
                    key={ci}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(7, ${TILE}px)`,
                      columnGap: `${GAP}px`,
                    }}
                  >
                    {col.days.map((day, ri) =>
                      renderTile(
                        day,
                        ri,
                        data,
                        levels,
                        endDate,
                        onTileClick,
                        TILE
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 小屏图例 */}
          <div className="mt-3 flex md:hidden items-center gap-2 text-label-small text-on-surface-variant">
            <span>少</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <span
                  key={lvl}
                  aria-hidden
                  className={clsx(
                    "h-3 w-3 rounded-sm border border-outline-variant/60",
                    levelClasses[Math.min(lvl, levelClasses.length - 1)]
                  )}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </>
      ) : (
        <Card>
          <h3 className="text-error text-xl">
            无法加载博客活动数据, 请稍候再试试。
            <br />
            如果多次出现, 直接来仓库开Issue砸我。
          </h3>
        </Card>
      )}
    </Card>
  );
}

function renderTile(
  day: Date,
  ri: number,
  data: ActivityMap,
  levels: number[],
  endDate: Date,
  onTileClick: Props["onTileClick"],
  TILE: number
) {
  const key = fmt(day);
  const count = data[key] ?? 0;
  const lvl = bucketLevel(count, levels);
  const bgClass = levelClasses[Math.min(lvl, levelClasses.length - 1)];
  const endKey = fmt(endDate);
  const isFuture = key > endKey;

  if (isFuture) {
    return (
      <div
        key={ri}
        className="rounded-sm border bg-outline-variant/10 border-outline-variant/30"
        style={{ width: TILE, height: TILE }}
        aria-hidden
      />
    );
  }

  const label = `${key}: ${count} 次更新`;

  return (
    <button
      key={ri}
      title={label}
      aria-label={label}
      onClick={() => onTileClick?.(key, count)}
      className={clsx(
        "rounded-sm border transition-[transform,box-shadow] outline-none",
        "border-outline-variant/60",
        "hover:scale-110 focus:scale-110",
        bgClass
      )}
      style={{ width: TILE, height: TILE }}
      suppressHydrationWarning
    />
  );
}
