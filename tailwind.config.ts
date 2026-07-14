import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EEF0EA",
        "paper-raised": "#F8F9F5",
        ink: "#1A2A26",
        "ink-soft": "#4B5A55",
        accent: "#2F6F5E",
        "accent-soft": "#DCE7E1",
        gold: "#A9823C",
        alert: "#AD4436",
        "alert-soft": "#F3E3DF",
        border: "#D9D6C8",
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
