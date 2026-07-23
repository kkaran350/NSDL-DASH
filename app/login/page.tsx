"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ThemeMode,
  AccentKey,
  loadThemePrefs,
  saveThemePrefs,
  applyThemeToDocument,
} from "@/lib/theme";
import { CubeIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? "Mittal Portfolios Pvt. Ltd.";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [accent, setAccent] = useState<AccentKey>("green");

  useEffect(() => {
    const prefs = loadThemePrefs();
    setTheme(prefs.theme);
    setAccent(prefs.accent);
    applyThemeToDocument(prefs.theme, prefs.accent);
  }, []);

  function toggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyThemeToDocument(next, accent);
    saveThemePrefs(next, accent);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your user name and password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="box-border flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-[400px] max-w-full rounded-[28px] px-[34px] pb-[30px] pt-9"
        style={{
          background: "var(--hl-card)",
          border: "1px solid var(--hl-card-border)",
          boxShadow: "0 24px 60px rgba(0,0,0,.14)",
        }}
      >
        <div className="flex flex-col items-center gap-3.5 text-center">
          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle dark / light mode"
            aria-label="Toggle dark / light mode"
            className="hl-tile-btn flex h-[58px] w-[58px] items-center justify-center rounded-[19px]"
          >
            <CubeIcon size={26} />
          </button>

          <div>
            <div className="flex items-center justify-center gap-2">
              <span
                className="inline-block h-0.5 w-[18px] rounded-sm"
                style={{ background: "var(--hl-accent)" }}
              />
              <span
                className="text-[9.5px] font-bold tracking-[0.28em]"
                style={{ color: "var(--hl-sub)" }}
              >
                NSDL · SPEED-e
              </span>
              <span
                className="inline-block h-0.5 w-[18px] rounded-sm"
                style={{ background: "var(--hl-accent)" }}
              />
            </div>
            <div
              className="mt-1.5 font-display text-[23px] font-extrabold tracking-[-0.02em]"
              style={{ color: "var(--hl-title)" }}
            >
              {ORG_NAME}
            </div>
            <div className="mt-1 text-[12.5px]" style={{ color: "var(--hl-sub)" }}>
              Holdings board — back office sign in
            </div>
          </div>
        </div>

        <div className="mt-[26px] flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="User name"
            aria-label="User name"
            autoComplete="username"
            autoFocus
            className="hl-input rounded-full px-[18px] py-[13px] text-[13.5px]"
          />

          <div className="relative">
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              className="hl-input box-border w-full rounded-full py-[13px] pl-[18px] pr-[46px] text-[13.5px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              title="Show / hide password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-transparent"
              style={{ color: "var(--hl-sub)" }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && (
            <div className="px-1.5 text-xs font-semibold" style={{ color: "#d64530" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="hl-signin-btn mt-1 rounded-full border-none py-[13px] text-[13.5px] font-extrabold tracking-[0.04em]"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center justify-center px-1.5 pt-0.5">
            <label
              className="flex cursor-pointer items-center gap-[7px] text-xs"
              style={{ color: "var(--hl-sub)" }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer"
                style={{ accentColor: "var(--hl-accent)" }}
              />
              Remember me
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
