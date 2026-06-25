import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Aurora Midnight palette
        midnight:  "#050810",
        "card-bg": "rgba(15,12,35,0.85)",
        indigo:    "#6366f1",
        violet:    "#8b5cf6",
        cyan:      "#06b6d4",
        "text-primary":   "#f1f5f9",
        "text-secondary": "#94a3b8",
        "accent-green":   "#10b981",
        "accent-amber":   "#f59e0b",
        // Keep legacy names for compatibility
        ink:    "#050810",
        ocean:  "#0f0c23",
        skyglow:"#06b6d4",
        aurora: "#10b981",
        storm:  "#1e293b",
        accent: "#8b5cf6",
      },
      backgroundImage: {
        "aurora-gradient": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
        "aurora-text":     "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #8b5cf6, #6366f1)",
        "card-surface":    "linear-gradient(145deg, rgba(15,12,35,0.9), rgba(5,8,16,0.8))",
      },
      boxShadow: {
        glow:         "0 0 48px rgba(139,92,246,0.25)",
        "glow-cyan":  "0 0 48px rgba(6,182,212,0.2)",
        "glow-green": "0 0 48px rgba(16,185,129,0.18)",
        "neon-violet":"0 0 20px rgba(139,92,246,0.4), 0 0 60px rgba(99,102,241,0.15)",
        "neon-cyan":  "0 0 20px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.15)",
      },
      animation: {
        "aurora-shift":  "aurora-shift 20s ease-in-out infinite",
        "float":         "float 8s ease-in-out infinite",
        "pulse-glow":    "pulse-glow 3s ease-in-out infinite",
        "fade-in":       "fade-in 0.4s ease-out",
        "slide-up":      "slide-up 0.35s ease-out",
        "slide-down":    "slide-down 0.25s ease-out",
        "gradient-text": "gradient-text 4s linear infinite",
        "count-up":      "count-up 1.2s ease-out",
        "bounce-soft":   "bounce-soft 2s ease-in-out infinite",
        // Legacy names
        pulseSoft: "pulse-glow 3s ease-in-out infinite",
        fadeIn:    "fade-in 0.25s ease-out",
        slideDown: "slide-down 0.2s ease-out",
      },
      keyframes: {
        "aurora-shift": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "25%":     { backgroundPosition: "50% 0%" },
          "50%":     { backgroundPosition: "100% 50%" },
          "75%":     { backgroundPosition: "50% 100%" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":     { transform: "translateY(-18px) rotate(1deg)" },
          "66%":     { transform: "translateY(-8px) rotate(-1deg)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.65", filter: "brightness(1)" },
          "50%":     { opacity: "1",    filter: "brightness(1.2)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-text": {
          "0%,100%": { backgroundPosition: "0% center" },
          "50%":     { backgroundPosition: "200% center" },
        },
        "count-up": {
          from: { opacity: "0", transform: "scale(0.85)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "bounce-soft": {
          "0%,100%": { transform: "translateY(0) scale(1)" },
          "50%":     { transform: "translateY(-6px) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
