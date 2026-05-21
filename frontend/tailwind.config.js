/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cabinet Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#000000", surface: "#09090B", panel: "#18181B" },
        line: "#27272A",
        ink: { DEFAULT: "#FFFFFF", secondary: "#A1A1AA", muted: "#71717A" },
        brand: { DEFAULT: "#F97316", hover: "#EA580C" },
        success: { DEFAULT: "#22C55E", hover: "#16A34A" },
        danger: "#EF4444",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tight2: "-0.02em",
        widest2: "0.2em",
      },
      boxShadow: {
        panel: "0 8px 32px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
      },
    },
  },
  plugins: [],
};
