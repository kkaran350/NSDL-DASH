# Holdings Ledger

A Next.js dashboard for depository holdings data (ISIN, quantity, last
transaction date), pulled live from a Google Sheet and refreshed every 5
minutes — matching the sheet's own update cadence.

Quantity (beneficiary balance) is the primary metric throughout. Price and
value are shown only as secondary, muted context, since these are unlisted
shares where the price is whatever was negotiated at the last sale, not a
market quote.

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

- `SHEET_ID` — already filled in with your sheet's ID.
- `SHEET_GID` — the tab's gid (from the sheet URL, after `#gid=`). Defaults to `0`.
- `SHEET_ACCESS_MODE` — leave as `csv` unless you need the sheet to stay
  unlisted. CSV mode requires the sheet be shared as **"Anyone with the
  link can view"** — no API key needed. If it must stay private, switch to
  `api` mode and fill in `GOOGLE_SHEETS_API_KEY` (a key restricted to the
  Sheets API), keeping in mind an API key still needs the sheet visible to
  it — a private sheet really needs a service account instead, which isn't
  wired in here yet.

```bash
npm run dev
```

Open http://localhost:3000.

## Data format expected

The sheet's first row is a header; columns after that must be, in order:

```
ISIN | Description | Last Transaction Date | Beneficiary Balance | Price | Value
```

This matches the depository export format already in use.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` under
   Project Settings → Environment Variables.
4. Deploy. The dashboard polls `/api/holdings` every 5 minutes client-side,
   and that route always fetches the sheet fresh (no server caching), so
   each poll reflects the latest sheet state.

## Known limitation: trend history

Quantity-change tracking (the "Δ since last sync" column) is built from
snapshots stored in the browser's own `localStorage` — there's no database
behind this yet. That means:

- Trend only accumulates while a given browser tab keeps polling.
- It resets if site data is cleared, and won't show up on a different
  device or browser.

If cross-device trend history matters, the next step is a small persistent
store (e.g. a Postgres/Supabase table keyed by `fetchedAt`) written to on
each successful poll, with the dashboard reading recent snapshots from
there instead of `localStorage`.
