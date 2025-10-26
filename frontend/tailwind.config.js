/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9f0",
          100: "#e0f2e0",
          200: "#c3e6c3",
          300: "#9dd99d",
          400: "#6bc96b",
          500: "#00b050",  // Credit Jambo green
          600: "#009944",
          700: "#008238",
          800: "#006b2c",
          900: "#005420"
        },
        creditjambo: {
          green: "#00b050",
          dark: "#008238",
          light: "#6bc96b"
        },
        secondary: {
          50: "#f7f8f0",
          100: "#ecefdc",
          200: "#d8deb9",
          300: "#c2cc94",
          400: "#a7b76f",
          500: "#8da34d",
          600: "#899b33",  // Your original secondary color
          700: "#6b7a28",
          800: "#4f5a1e",
          900: "#343e14"
        },
        base: {
          50: "#f9fbf5",
          100: "#eff5e7",
          200: "#ddeacc",
          300: "#c8dfb0",
          400: "#b0d394",
          500: "#a8c27a",  // Your original base color
          600: "#94b05f",
          700: "#78904c",
          800: "#5d6d3a",
          900: "#414d28"
        },
        black: "#2e3e14"  // Kept as direct color alias
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      }
    },
  },
  plugins: [],
}