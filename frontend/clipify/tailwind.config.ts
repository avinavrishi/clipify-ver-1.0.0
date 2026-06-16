import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clip: {
          black: "#0a0a0a",
          "black-soft": "#141414",
          "black-card": "#1a1a1a",
          white: "#ffffff",
          "white-muted": "#e5e5e5",
          "white-dim": "#a3a3a3",
          blue: "#2563eb",
          "blue-hover": "#1d4ed8",
          "blue-light": "#3b82f6",
          "blue-muted": "#1e40af",
        },
      },
      maxWidth: {
        content: "1200px",
        form: "420px",
      },
    },
  },
  plugins: [],
};

export default config;
