// Search 组件
"use client";

import { Icon, IconButton } from "actify";
import { ReactNode } from "react";
import type { ToastState } from "@react-stately/toast";

interface SearchProps {
  toastState?: ToastState<ReactNode>;
  className?: string;
}

export default function Search({ toastState, className }: SearchProps) {
  const handleClick = () => {
    if (toastState) {
      toastState.add("正在开发中", {
        timeout: 3000,
      });
    }
  };

  return (
    <IconButton onClick={handleClick}>
      <Icon className={`${className}`}>Search</Icon>
    </IconButton>
  );
}
