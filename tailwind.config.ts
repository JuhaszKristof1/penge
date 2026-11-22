import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/context/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semleges, sötét grafit/fekete alap. A motorsport-arculat ezekre épül:
        // nincs neon, nincs színes gradiens – a kontraszt és a fotók dominálnak.
        ink: {
          950: "#0a0a0b",
          900: "#101113",
          850: "#16181b",
          800: "#1c1f23",
          700: "#272b31",
          600: "#363b43",
          500: "#4a5058",
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
        // Visszafogott árnyékok: nincs neon "glow", csak mélység.
        card: "0 18px 40px -28px rgba(0,0,0,0.9)",
        lift: "0 24px 50px -32px rgba(0,0,0,0.95)",
      },
      backgroundImage: {
        "hero-scrim":
          "linear-gradient(to top, rgba(10,10,11,1) 2%, rgba(10,10,11,0.55) 42%, rgba(10,10,11,0.25) 70%, rgba(10,10,11,0.7) 100%)",
        // Visszafogott kockás zászló sáv (start-cél vonal) – halvány, nem hivalkodó.
        checker:
          "repeating-conic-gradient(rgba(255,255,255,0.09) 0% 25%, transparent 0% 50%)",
        // Finom átlós motorsport-csíkozás a panelek sarkában.
        "diag-lines":
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 9px)",
      },
      backgroundSize: {
        checker: "14px 14px",
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
        // Badge teljesítésekor: visszafogott, egyszeri "kinyílás".
        "badge-pop": {
          "0%": { transform: "scale(0.92)", opacity: "0.6" },
          "55%": { transform: "scale(1.03)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Teljesített jelvény körül egyszer lefutó fénygyűrű.
        "badge-ring": {
          "0%": { opacity: "0.55", transform: "scale(0.96)" },
          "100%": { opacity: "0", transform: "scale(1.22)" },
        },
        // Lassú, finom fénypásztázás a jelvény felületén.
        "badge-sheen": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "badge-pop": "badge-pop 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "badge-ring": "badge-ring 1.1s cubic-bezier(0.22,1,0.36,1) 1",
        "badge-sheen": "badge-sheen 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
