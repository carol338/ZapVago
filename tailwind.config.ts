import type { Config } from "tailwindcss";

// Tema ZapVago: dark mode por padrão, verde WhatsApp como cor de destaque.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        zap: {
          DEFAULT: "#00A884",
          dark: "#00806A",
          light: "#06CF9C",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
          border: "var(--color-surface-border)",
        },
        risk: {
          low: "#10B981",
          mid: "#F59E0B",
          high: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
