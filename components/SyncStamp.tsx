"use client";

interface SyncStampProps {
  lastSyncedAt: string | null;
  nextSyncInSeconds: number;
  isSyncing: boolean;
  error: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  return (
    <div className="flex items-center gap-3 rounded border border-border bg-paper-raised px-4 py-2">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-accent">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            error ? "bg-alert" : "bg-accent"
          } ${isSyncing ? "" : "stamp-dot"}`}
        />
      </div>
      <div className="font-mono text-xs leading-tight">
        <div className="tracking-wide text-ink-soft">
          {error ? "SYNC FAILED" : isSyncing ? "SYNCING…" : "DEPOSITORY SYNCED"}
        </div>
        <div className="tabular text-ink">
          {formatTime(lastSyncedAt)}
          <span className="mx-1.5 text-ink-soft">·</span>
          next in {formatCountdown(nextSyncInSeconds)}
        </div>
      </div>
    </div>
  );
}
