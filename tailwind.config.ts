import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060b18",
          900: "#0a1128",
          800: "#0e1a3d",
          700: "#132052",
        },
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // GE HealthCare brand purple
        gehc: {
          50:  "#f3eeff",
          100: "#e4d4ff",
          200: "#c9a8ff",
          300: "#a87de8",
          400: "#8b50d4",
          500: "#6022a6", // primary brand purple
          600: "#4e1a8a",
          700: "#3d1470",
          800: "#2d0a6b", // dark purple (header)
          900: "#1a063d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
