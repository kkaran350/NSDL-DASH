"use client";

import { ThemeMode } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => onThemeChange(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="hl-panel hl-icon-btn flex h-[46px] w-[46px] items-center justify-center rounded-full"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
