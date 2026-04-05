import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#243449",
        input: "#1b2737",
        ring: "#f59e0b",
        background: "#09111d",
        foreground: "#f8fafc",
        primary: {
          DEFAULT: "#f97316",
          foreground: "#111827"
        },
        secondary: {
          DEFAULT: "#14b8a6",
          foreground: "#06201d"
        },
        muted: {
          DEFAULT: "#132033",
          foreground: "#9fb1c6"
        },
        accent: {
          DEFAULT: "#facc15",
          foreground: "#1f2937"
        },
        card: {
          DEFAULT: "#0f1a2b",
          foreground: "#f8fafc"
        }
      },
      boxShadow: {
        panel: "0 18px 48px rgba(0, 0, 0, 0.28)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;
