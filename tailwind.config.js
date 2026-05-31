/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "#0f0f13",
          secondary: "#16161c",
          tertiary: "#1e1e27",
          card: "#252530",
        },
        accent: {
          DEFAULT: "#6c63ff",
          light: "#8b82ff",
          bg: "rgba(108,99,255,0.12)",
        },
        border: {
          DEFAULT: "#2e2e3a",
          light: "#3a3a48",
        },
      },
    },
  },
  plugins: [],
};
