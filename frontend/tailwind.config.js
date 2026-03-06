/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      colors: {
        teal: {
          dark: "#005461",
          DEFAULT: "#018790",
          light: "#00b7b5",
        },
        gray: {
          light: "#f4f4f4",
        },
      },
    },
  },
  plugins: [],
};
