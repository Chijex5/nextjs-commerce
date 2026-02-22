"use client";
import { Suspense } from "react";
import TheWrapper from "./the-wrapper";

export default function childrenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TheWrapper>{children}</TheWrapper>
    </Suspense>
  );
}