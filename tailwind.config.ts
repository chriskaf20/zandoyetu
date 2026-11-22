import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        brand: {
          black: "#111111",
          pureBlack: "#000000",
          charcoal: "#222222",
          gray: "#707072",
          lightGray: "#F4F4F4",
          offWhite: "#F9F9F9",
          border: "#E5E5E5",
          accent: "#D97706",
          emerald: "#22C55E",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
        xl: "8px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.05)",
        card: "0 2px 8px rgba(0,0,0,0.04)",
        hover: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [animate],
};
export default config;
