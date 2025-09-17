"use client";

import { useScroll } from "@/hooks/useScroll";
import { useBlogStore } from "@/lib/store/blog-store";
import {
  Button,
  DrawerActivator,
  DrawerContent,
  Fab,
  FocusRing,
  Icon,
  IconButton,
  NavigationDrawer,
  Ripple,
  SnackbarProvider,
} from "actify";
import { usePathname } from "next/navigation";
import { JSX, ReactNode, useEffect, useRef, useState } from "react";

import clsx from "clsx";
import Link from "next/link";

import Search from "../search";
import { ThemeChanger } from "../theme-changer";
import UrlCopyButton from "./url-copy-button";
import { useWindowSize } from "@/hooks/useWindowSize";

import Image from "next/image";
import {
  OutsideDismissOptions,
  useOutsideDismiss,
} from "@/hooks/useOutsideDismiss";
import { useTheme } from "next-themes";

type NavsStyle = "horizontal" | "vertical";

function NavItem({ children, link }: { children?: ReactNode; link?: string }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Link
      href={link || "#"}
      className="text-xl/loose relative rounded-2xl"
      onClick={() => {
        setIsFocused(true);

        setTimeout(() => {
          setIsFocused(false);
        }, 2000);
      }}
    >
      {isFocused && <FocusRing />}
      {children}
    </Link>
  );
}

function Navs({ type }: { type: NavsStyle }) {
  const links = (
    <>
      <NavItem link="/">首页</NavItem>
      <NavItem link="/blog">笔记</NavItem>
      <NavItem link="/about">关于</NavItem>
      <NavItem link="/tool">小工具</NavItem>
    </>
  );

  const horizontalContent = (
    <nav className="flex min-w-48">
      <ul className="w-full flex flex-row  gap-8 font-medium justify-around">
        {links}
      </ul>
    </nav>
  );

  const verticalContent = (
    <nav className="flex w-full min-h-128">
      <ul className="w-full flex flex-col gap-8 font-medium justify-center items-center">
        <Image
          src="/avatar/Apryes.jpg"
          alt="avatar"
          width={96}
          height={96}
          className="rounded-full shadow-xl shadow-shadow"
        />
        {links}
      </ul>
    </nav>
  );

  return type == "horizontal" ? horizontalContent : verticalContent;
}

// 页面信息配置
const PAGE_CONFIG = {
  "/": { type: "home", title: null },
  "/about": { type: "static", title: "关于" },
  "/tool": { type: "static", title: "小工具" },
  "/blog/category": { type: "static", title: "分类" },
  // 其他博客页面会被识别为 "blog" 类型
} as const;

type PageType = "home" | "static" | "blog";
type ScrollState = "scrolled" | "notScrolled";

function getPageInfo(pathname: string): {
  type: PageType;
  title: string | null;
} {
  if (pathname in PAGE_CONFIG) {
    return PAGE_CONFIG[pathname as keyof typeof PAGE_CONFIG];
  }
  // 默认为博客页面
  return { type: "blog", title: null };
}

export default function Header() {
  const { scrollDistance, isScrollDown } = useScroll();
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);
  const blogTitle = useBlogStore((state) => state.title);
  const [isMounted, setIsMounted] = useState(false);

  const { isWide } = useWindowSize();
  const [isSideOpen, setIsSideOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function getHeaderContent(type: NavsStyle) {
    // 决策表: 定义每种页面类型在不同滚动状态下的内容
    const contentMap: Record<
      PageType,
      Record<ScrollState, () => JSX.Element>
    > = {
      home: {
        scrolled: () => <Navs type={type} />,
        notScrolled: () => <Navs type={type} />,
      },
      static: {
        scrolled: () => (
          <>
            {!isWide && <Navs type="vertical" />}
            <div className="w-full text-tertiary font-bold flex flex-row items-center justify-center gap-2">
              <h1 className="text-tertiary font-bold">{pageInfo.title}</h1>
            </div>
          </>
        ),
        notScrolled: () => <Navs type={type} />,
      },
      blog: {
        scrolled: () => (
          <>
            {!isWide && <Navs type="vertical" />}
            <div className="w-full text-tertiary font-bold flex flex-row items-center justify-center gap-2">
              <h1 className="text-center">{blogTitle}</h1>
              <SnackbarProvider>
                {(globalState) => <UrlCopyButton toastState={globalState} />}
              </SnackbarProvider>
            </div>
          </>
        ),
        notScrolled: () => <Navs type={type} />,
      },
    };

    // 确定滚动状态
    const scrollState: ScrollState =
      isMounted && isScrollDown && scrollDistance > 150
        ? "scrolled"
        : "notScrolled";

    // 根据页面类型和滚动状态返回对应内容
    return contentMap[pageInfo.type][scrollState]();
  }

  const detached = scrollDistance > 5;

  const panelRef = useRef<HTMLDivElement | null>(null);

  useOutsideDismiss({
    enabled: isSideOpen,
    refs: [panelRef],
    onDismiss: () => setIsSideOpen(false),
    ignore: (t) =>
      (t as HTMLElement | null)?.closest?.("[data-ignore-outside]") != null,
    trigger: "up",
    touchSlop: 12,
    closeOnFocusOut: false,
  });

  const { resolvedTheme } = useTheme();

  return (
    <SnackbarProvider>
      {(globalState) => (
        <>
          {isWide ? (
            <header
              className={`
                  flex flex-row justify-between items-center min-h-16 pl-8 pr-8 pt-1 pb-1
                  sticky z-999 bg-on-secondary-container
                  transition-all duration-300 ease-out
                  ${clsx(
                    detached
                      ? "bg-surface-variant ml-2 mr-2 top-2 rounded-4xl shadow-lg text-on-surface"
                      : "ml-0 mr-0 top-0 rounded-none text-on-primary"
                  )}
              `}
            >
              <h1
                className={`text-xl min-w-32 ${
                  detached ? "text-primary" : null
                } font-semibold`}
              >
                <NavItem link="/">Apry的笔记本</NavItem>
              </h1>
              {getHeaderContent(isWide ? "horizontal" : "vertical")}
              <div className="flex flex-row gap-4 items-center">
                <Search toastState={globalState} />
                <ThemeChanger
                  className={`${clsx(
                    detached ? "text-on-surface" : "text-on-primary"
                  )}`}
                />
              </div>
            </header>
          ) : isSideOpen ? (
            <div className="z-[999] w-[100vw] h-[100vh] bg-black/50 fixed top-0 left-0">
              <div
                className={`w-64 max-w-64 h-[100vh] bg-on-primary-container fixed top-0 left-0 ${
                  isMounted && resolvedTheme == "light"
                    ? "text-on-primary"
                    : "text-primary"
                }`}
                ref={panelRef}
              >
                {getHeaderContent(isWide ? "horizontal" : "vertical")}
              </div>
            </div>
          ) : (
            <div className="z-[999] fixed bottom-0 left-0 m-4 flex flex-col-reverse gap-2 items-center">
              <Fab
                aria-label="open-side-nav"
                size="medium"
                className="bg-on-secondary-container! shadow-md! shadow-shadow"
                icon={<Icon className="text-surface">Side_Navigation</Icon>}
                onPress={() => setIsSideOpen(!isSideOpen)}
              ></Fab>
              <div
                aria-label="open-theme-changer"
                className="relative rounded-2xl w-12 h-12 flex justify-center items-center bg-on-secondary-container shadow-md shadow-shadow"
              >
                <Ripple />
                <ThemeChanger className="text-surface" />
              </div>
              <div
                aria-label="close-widgets"
                className={`
                  cursor-pointer relative rounded-2xl w-12 h-12 flex justify-center items-center ${
                    isMounted && resolvedTheme == "dark"
                      ? "bg-on-primary-container"
                      : "bg-primary-container"
                  } shadow-md shadow-shadow`}
                role="button"
              >
                <Ripple />
                <Icon>Keyboard_Arrow_Left</Icon>
              </div>
            </div>
          )}
        </>
      )}
    </SnackbarProvider>
  );
}
