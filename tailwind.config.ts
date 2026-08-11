import type { Config } from "tailwindcss";

// Tema ZapVago: dark mode por padrão, verde WhatsApp como cor de destaque.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        foreground: "#FAFAFA",
        zap: {
          DEFAULT: "#00A884",
          dark: "#00806A",
          light: "#06CF9C",
        },
        surface: {
          DEFAULT: "#141416",
          hover: "#1C1C1F",
          border: "#26262A",
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
