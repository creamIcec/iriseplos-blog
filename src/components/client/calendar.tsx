"use client";

import { Button, Icon, IconButton } from "actify";
import clsx from "clsx";
import { useMemo, useState } from "react";

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

export default function Calendar({
  value,
  onChange,
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => value || new Date());
  const [viewDate, setViewDate] = useState(() => value || new Date());

  // 获取当月的日历数据
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 当月第一天
    const firstDay = new Date(year, month, 1);
    // 当月最后一天
    const lastDay = new Date(year, month + 1, 0);
    // 第一天是星期几
    const firstDayWeek = firstDay.getDay();
    // 当月天数
    const daysInMonth = lastDay.getDate();

    // 上月需要显示的天数
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    const days = [];

    // 填充上月的日期
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        isNextMonth: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i),
      });
    }

    // 填充当月的日期
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({
        date,
        isCurrentMonth: true,
        isNextMonth: false,
        fullDate: new Date(year, month, date),
      });
    }

    // 填充下月的日期（补齐6行42天）
    const remainingCells = 42 - days.length;
    for (let date = 1; date <= remainingCells; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        isNextMonth: true,
        fullDate: new Date(year, month + 1, date),
      });
    }

    return days;
  }, [viewDate]);

  // 是否为今天
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 是否为选中日期
  const isSelected = (date: Date) => {
    return currentDate && date.toDateString() === currentDate.toDateString();
  };

  // 处理日期点击
  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    onChange?.(date);
  };

  // 上一月
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // 下一月
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // 回到今天
  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    setCurrentDate(today);
    onChange?.(today);
  };

  return (
    <div
      className={clsx(
        "bg-surface rounded-xl shadow-sm border border-outline-variant w-80 p-6",
        className
      )}
    >
      {/* 头部 - 年月导航 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium text-on-surface">
            {viewDate.getFullYear()}年 {MONTHS[viewDate.getMonth()]}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={handlePrevMonth}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <Icon>chevron_left</Icon>
          </IconButton>
          <IconButton
            onClick={handleNextMonth}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <Icon>chevron_right</Icon>
          </IconButton>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-on-surface-variant"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarData.map((dayData, index) => {
          const isCurrentMonthDate = dayData.isCurrentMonth;
          const isTodayDate = isToday(dayData.fullDate);
          const isSelectedDate = isSelected(dayData.fullDate);

          return (
            <button
              key={`${dayData.fullDate.getTime()}-${index}`}
              onClick={() => handleDateClick(dayData.fullDate)}
              className={clsx(
                "h-10 w-10 rounded-full text-sm font-medium transition-colors duration-200",
                "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary",
                {
                  // 当前月份的日期
                  "text-on-surface": isCurrentMonthDate,
                  // 非当前月份的日期
                  "text-on-surface-variant": !isCurrentMonthDate,
                  // 今天
                  "bg-primary-container text-on-primary-container font-semibold":
                    isTodayDate && !isSelectedDate,
                  // 选中日期
                  "bg-primary text-on-primary font-semibold": isSelectedDate,
                  // 选中的今天
                  "bg-primary text-on-primary": isSelectedDate && isTodayDate,
                }
              )}
            >
              {dayData.date}
            </button>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div className="flex justify-between items-center">
        <Button variant="text" onClick={handleToday} className="text-primary">
          今天
        </Button>
        <div className="text-sm text-on-surface-variant">
          {currentDate.toLocaleDateString("zh-CN")}
        </div>
      </div>
    </div>
  );
}
