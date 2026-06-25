import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0a0a1a",
        ocean: "#0f0728",
        skyglow: "#a78bfa",
        aurora: "#22d3ee",
        storm: "#1e1b4b",
        neon: "#f472b6",
      },
      boxShadow: {
        glow: "0 0 60px rgba(167,139,250,0.25)",
        "glow-cyan": "0 0 60px rgba(34,211,238,0.20)",
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
        fadeIn: "fadeIn 0.3s ease-out",
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        pulseSoft: { "0%, 100%": { opacity: "0.72" }, "50%": { opacity: "1" } },
        fadeIn: { from: { opacity: "0", transform: "translateY(-6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
