"use client";

import { ThemeMode, AccentKey, ACCENT_OPTIONS } from "@/lib/theme";

interface ThemeToggleProps {
  theme: ThemeMode;
  accent: AccentKey;
  onThemeChange: (theme: ThemeMode) => void;
  onAccentChange: (accent: AccentKey) => void;
}

export default function ThemeToggle({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
}: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-paper-raised px-3 py-2">
      <button
        onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
        className="rounded border border-border px-2 py-1 font-mono text-xs uppercase tracking-wider text-ink-soft transition hover:border-accent hover:text-ink"
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      <div className="flex items-center gap-1.5 pl-1">
        {ACCENT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onAccentChange(opt.key)}
            title={opt.label}
            aria-label={opt.label}
            className={`h-5 w-5 rounded-full border transition ${
              accent === opt.key
                ? "border-ink ring-2 ring-offset-1 ring-ink/30"
                : "border-border hover:scale-110"
            }`}
            style={{ backgroundColor: opt.swatch }}
          />
        ))}
      </div>
    </div>
  );
}