import animation from "./tailwind.animation.js";
import icons from "./tailwind.icons.js";

/** @type {import('tailwindcss').Config} */
export default {
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    animation,
    icons,
  ],
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    colors: {
      transparent: "transparent",
      black: "hsl(var(--color-black))",
      white: "hsl(var(--color-white))",

      gray: {
        50: "hsl(var(--color-slate-50))",
        100: "hsl(var(--color-slate-100))",
        200: "hsl(var(--color-slate-200))",
        300: "hsl(var(--color-slate-300))",
        400: "hsl(var(--color-slate-400))",
        500: "hsl(var(--color-slate-500))",
        600: "hsl(var(--color-slate-600))",
        700: "hsl(var(--color-slate-700))",
        800: "hsl(var(--color-slate-800))",
        900: "hsl(var(--color-slate-900))",
        950: "hsl(var(--color-slate-950))",
      },

      primary: {
        500: "hsl(var(--color-primary-500))",
        600: "hsl(var(--color-primary-600))",
        700: "hsl(var(--color-primary-700))",
      },
      accent: {
        500: "hsl(var(--color-accent-500))",
        600: "hsl(var(--color-accent-600))",
      },
      text: {
        200: "hsl(var(--color-text-200))",
        400: "hsl(var(--color-text-400))",
      },
      bg: {
        50: "hsl(var(--color-bg-50))",
        100: "hsl(var(--color-bg-100))",
        200: "hsl(var(--color-bg-200))",
      },
    },
  },
};
