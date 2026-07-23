"use client";

import { useEffect, useRef, useState } from "react";
import { CubeIcon, PowerIcon, ZohoIcon } from "./icons";

/**
 * The cube button in the top-left. Opening it floats the button and reveals
 * a small tray: switch across to Zoho, or sign out.
 *
 * Set NEXT_PUBLIC_ZOHO_URL to point the Zoho button somewhere; without it
 * the button is hidden rather than dead.
 */
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const zohoUrl = process.env.NEXT_PUBLIC_ZOHO_URL;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Clearing the cookie failed — send them to /login anyway, the gate
      // will bounce them back here if the session is somehow still valid.
    }
    window.location.href = "/login";
  }

  return (
    <div ref={wrapRef} className="relative z-[60] flex-none">
      <button
        onClick={() => setOpen((o) => !o)}
        data-open={open}
        title="Account menu"
        aria-label="Account menu"
        aria-expanded={open}
        className="hl-panel hl-menu-btn flex h-[54px] w-[54px] items-center justify-center rounded-[18px]"
      >
        <CubeIcon />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[62px] flex gap-1.5 rounded-2xl p-[7px]"
          style={{
            background: "var(--hl-menu-bg)",
            border: "1px solid var(--hl-panel-border)",
            boxShadow: "var(--hl-table-shadow)",
            backdropFilter: "blur(30px) saturate(1.8)",
            WebkitBackdropFilter: "blur(30px) saturate(1.8)",
          }}
        >
          {zohoUrl && (
            <a
              href={zohoUrl}
              target="_blank"
              rel="noreferrer"
              title="Switch to Zoho"
              aria-label="Switch to Zoho"
              onClick={() => setOpen(false)}
              className="hl-zoho-btn flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[13px]"
            >
              <ZohoIcon />
            </a>
          )}
          <button
            onClick={handleLogout}
            disabled={signingOut}
            title="Log out"
            aria-label="Log out"
            className="hl-logout-btn flex h-[42px] w-[42px] flex-none cursor-pointer items-center justify-center rounded-[13px] border-none disabled:opacity-60"
          >
            <PowerIcon />
          </button>
        </div>
      )}
    </div>
  );
}
