import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2B6E2F",
          foreground: "#FFFFFF",
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#4CAF50",
          500: "#2B6E2F",
          600: "#245A27",
          700: "#1B4D1E",
          800: "#133A15",
          900: "#0A260B",
        },
        accent: {
          DEFAULT: "#F5B731",
          foreground: "#1A1A1A",
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#F5B731",
          500: "#E5A100",
          600: "#C68A00",
          700: "#A67200",
          800: "#875A00",
          900: "#5C3D00",
        },
        cream: {
          DEFAULT: "#FFF9ED",
          50: "#FFFDF7",
          100: "#FFF9ED",
          200: "#FFF3D6",
          300: "#FFEDC0",
        },
        bark: {
          DEFAULT: "#3A2A14",
          light: "#5C4A30",
          dark: "#2A1A08",
        },
        foam: "#FFF5E0",
        hop: "#4A8D4C",
      },
      fontFamily: {
        display: ['"Baloo 2"', "cursive"],
        body: ['"Nunito"', "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bubble": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "100%": { transform: "translateY(-120px) scale(0.3)", opacity: "0" },
        },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "bubble": "bubble 3s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
