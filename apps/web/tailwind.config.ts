import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink:    "#080e1a",
        ocean:  "#0d1629",
        skyglow:"#38bdf8",
        aurora: "#34d399",
        storm:  "#1e293b",
        accent: "#818cf8",
      },
      boxShadow: {
        glow: "0 0 48px rgba(56,189,248,0.2)",
        "glow-green": "0 0 48px rgba(52,211,153,0.18)",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
        fadeIn: "fadeIn 0.25s ease-out",
        slideDown: "slideDown 0.2s ease-out",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        pulseSoft: { "0%,100%": { opacity: "0.7" }, "50%": { opacity: "1" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
