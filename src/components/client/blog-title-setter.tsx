"use client";

import { useBlogStore } from "@/lib/store/blog-store";
import { useEffect } from "react";

interface BlogTitleSetterProps {
  title?: string;
}

export default function BlogTitleSetter({ title = "" }: BlogTitleSetterProps) {
  const { setTitle, clearTitle } = useBlogStore();

  useEffect(() => {
    setTitle(title);

    return () => {
      clearTitle();
    };
  }, [title, setTitle, clearTitle]);

  return null;
}
