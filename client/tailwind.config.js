/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#f8fafc", 100:"#f1f5f9", 600:"#2563eb", 700:"#1d4ed8" }
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"] }
    },
  },
  plugins: [],
};
