import type { Metadata } from "next";
import { Schibsted_Grotesk, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Holdings Ledger — NSDL SPEED-e",
  description: "Live depository holdings by quantity, refreshed every 5 minutes.",
};

/**
 * Applies the saved theme to <html> before first paint, so a dark-mode user
 * doesn't get a white flash on every navigation. Keep the storage key in
 * sync with THEME_KEY in lib/theme.ts.
 */
const NO_FLASH_SCRIPT = `
try {
  var t = localStorage.getItem("holdings-dashboard:theme");
  if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body
        className={`${schibsted.variable} ${manrope.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
