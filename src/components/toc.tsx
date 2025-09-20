"use client";

import { useState, useEffect, useRef } from "react";
import { Heading } from "@/lib/markdown-data";

interface TOCProps {
  headings: Heading[];
  maxDepth?: number;
}

export default function TOC({ headings, maxDepth = 4 }: TOCProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver(
      (entries) => {
        // 找到当前视窗中最靠上的标题
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target);

        if (visibleHeadings.length > 0) {
          // 获取第一个可见标题的 id
          setActiveId(visibleHeadings[0].id);
        }
      },
      {
        // 根元素默认为浏览器视窗
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0.1, // 当10%的元素可见时触发
      }
    );

    // 获取所有标题元素并添加观察
    const headingElements = headings
      .filter((h) => h.depth <= maxDepth)
      .map((h) => document.getElementById(h.id))
      .filter(Boolean); // 过滤掉不存在的元素

    headingElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [headings, maxDepth]);

  const filteredHeadings = headings.filter((h) => h.depth <= maxDepth);

  return (
    <nav aria-label="Table of contents">
      <ul>
        {filteredHeadings.map((h, idx) => {
          const indent = (h.depth - 1) * 2;
          const isActive = h.id === activeId;

          return (
            <li
              key={`${h.id}-${idx}`}
              className={`pl-${indent} ${
                isActive && "border-l-2 border-primary border-solid"
              }`}
            >
              <a
                href={`#${h.id}`}
                className={`
                  hover:underline 
                  transition-colors duration-200
                  ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-outline hover:text-primary"
                  }
                `}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
