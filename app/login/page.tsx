"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded border border-border bg-paper-raised p-6"
      >
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          Depository Holdings
        </div>
        <h1 className="mt-1 font-display text-2xl italic text-ink">Sign in</h1>

        <label className="mt-6 block text-xs font-mono uppercase tracking-wider text-ink-soft">
          Email
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />

        <label className="mt-4 block text-xs font-mono uppercase tracking-wider text-ink-soft">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />

        {error && (
          <div className="mt-4 rounded border border-alert bg-alert-soft px-3 py-2 text-xs text-alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded border border-accent bg-accent px-3 py-2 font-mono text-xs uppercase tracking-wider text-paper transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
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