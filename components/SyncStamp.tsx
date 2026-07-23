"use client";

interface SyncStampProps {
  lastSyncedAt: string | null;
  nextSyncInSeconds: number;
  isSyncing: boolean;
  error: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function SyncStamp({
  lastSyncedAt,
  nextSyncInSeconds,
  isSyncing,
  error,
}: SyncStampProps) {
  const label = error
    ? "SYNC FAILED"
    : isSyncing
    ? "SYNCING…"
    : `LAST SYNC ${formatTime(lastSyncedAt)}`;

  return (
    <div className="hl-panel flex items-center gap-2.5 rounded-full px-3.5 py-2">
      <span
        className="hl-pulse h-2 w-2 flex-none rounded-full"
        style={{ background: error ? "var(--hl-red)" : "var(--hl-accent)" }}
      />
      <div className="text-[11.5px] leading-[1.45]">
        <span
          className="font-semibold tracking-[0.12em]"
          style={{ color: "var(--hl-sub)" }}
        >
          {label}
        </span>
        <br />
        <span style={{ color: "var(--hl-text)" }}>
          next in{" "}
          <span className="tabular font-bold">
            {formatCountdown(nextSyncInSeconds)}
          </span>
        </span>
      </div>
    </div>
  );
}
