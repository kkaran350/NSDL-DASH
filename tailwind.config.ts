import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
      paper: "rgb(var(--color-paper) / <alpha-value>)",
      "paper-raised": "rgb(var(--color-paper-raised) / <alpha-value>)",
      ink: "rgb(var(--color-ink) / <alpha-value>)",
      "ink-soft": "rgb(var(--color-ink-soft) / <alpha-value>)",
      accent: "rgb(var(--color-accent) / <alpha-value>)",
      "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
      gold: "rgb(var(--color-gold) / <alpha-value>)",
      alert: "rgb(var(--color-alert) / <alpha-value>)",
      "alert-soft": "rgb(var(--color-alert-soft) / <alpha-value>)",
      border: "rgb(var(--color-border) / <alpha-value>)",
    },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
