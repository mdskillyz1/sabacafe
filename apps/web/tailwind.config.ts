import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: "#D9902A",
        clay: "#9A4E2D",
        date: "#3B2118",
        cream: "#FFF7EA",
        mint: "#1E7A68",
        ink: "#1B1715"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(59, 33, 24, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
