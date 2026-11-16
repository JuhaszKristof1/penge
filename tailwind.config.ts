import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080a",
          900: "#0b0d10",
          850: "#101317",
          800: "#16191f",
          700: "#1e232b",
          600: "#2a3038",
          500: "#3a424c",
        },
        graphite: {
          50: "#f6f7f8",
          100: "#e9ebee",
          200: "#cfd3d9",
          300: "#a9b0ba",
          400: "#7d8590",
          500: "#5c646e",
          600: "#464d56",
          700: "#343a42",
          800: "#23272e",
          900: "#171a1f",
        },
        brand: {
          50: "#fff6ed",
          100: "#ffe9d4",
          200: "#ffd0a8",
          300: "#ffb171",
          400: "#ff8a3d",
          500: "#ff6a00",
          600: "#f04e00",
          700: "#c73a02",
          800: "#9e2f0b",
          900: "#7f2a0c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,106,0,0.35), 0 18px 50px -12px rgba(255,106,0,0.45)",
        card: "0 24px 60px -30px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
        "radial-brand":
          "radial-gradient(60% 60% at 50% 0%, rgba(255,106,0,0.22) 0%, rgba(255,106,0,0) 70%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
