import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#061225",
        ocean: "#0b3a67",
        skyglow: "#39c2ff",
        aurora: "#45f0c2",
        storm: "#111827"
      },
      boxShadow: { glow: "0 0 60px rgba(57, 194, 255, 0.22)" },
      animation: { float: "float 7s ease-in-out infinite", pulseSoft: "pulseSoft 3s ease-in-out infinite" },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        pulseSoft: { "0%, 100%": { opacity: "0.72" }, "50%": { opacity: "1" } }
      }
    }
  },
  plugins: []
};

export default config;
