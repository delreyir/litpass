import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LitPass palette - silver litecoin + electric cyan
        ink: {
          950: "#05070d",
          900: "#080c18",
          800: "#0b1020",
          700: "#111729",
          600: "#1b2440",
        },
        silver: {
          50:  "#f4f6fb",
          100: "#e6eaf3",
          200: "#cdd4e3",
          300: "#a4afc7",
          400: "#7c8aa8",
          500: "#566280",
        },
        accent: {
          DEFAULT: "#22d3ee",
          soft:    "#67e8f9",
          deep:    "#0891b2",
          violet:  "#a78bfa",
          gold:    "#fbbf24",
          rose:    "#fb7185",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
        display: ["Sora", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(34,211,238,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.25), 0 20px 60px -20px rgba(34,211,238,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 80px -30px rgba(0,0,0,0.7)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        "shimmer": "shimmer 2.4s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
