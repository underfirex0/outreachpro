import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: "#0C0F14",
        surface: "#141820",
        surface2: "#1C2230",
        surface3: "#242B3D",
        accent: "#4ADE80",
        blue: "#60A5FA",
        warm: "#FB923C",
        danger: "#F87171",
      },
    },
  },
  plugins: [],
} satisfies Config;
