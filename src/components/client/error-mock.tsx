"use client";

import { useEffect } from "react";

export default function ErrorMock() {
  useEffect(() => {
    throw new Error("Exception Test");
  }, []);

  return <></>;
}
