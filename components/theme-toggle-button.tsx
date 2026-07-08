"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

/**
 * Compact single-button theme switcher for site chrome (navbar / admin header).
 * Clicking sets an explicit "light" / "dark" preference in localStorage and
 * flips the `.dark` class + color-scheme. The pre-paint script in layout.tsx
 * seeds the initial state, so this only needs to read/toggle it.
 */
export default function ThemeToggleButton({
  className,
  style,
  iconClassName = "h-4 w-4",
}: {
  className?: string;
  style?: CSSProperties;
  iconClassName?: string;
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore storage failures */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={className}
      style={style}
    >
      {isDark ? (
        <SunIcon className={iconClassName} aria-hidden="true" />
      ) : (
        <MoonIcon className={iconClassName} aria-hidden="true" />
      )}
    </button>
  );
}
