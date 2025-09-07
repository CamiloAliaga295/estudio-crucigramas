/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        chemistry: {
          50: "#eaf9f4",
          100: "#c9f0e3",
          200: "#a3e6d0",
          300: "#6fd7b8",
          400: "#36c39a",
          500: "#1ba881",
          600: "#108a6b",
          700: "#0f6d56",
          800: "#0f5646",
          900: "#0d463a",
        }
      }
    },
  },
  plugins: [],
}
