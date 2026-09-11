/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Slaky-style neutral ink scale — `brand-*` classes now render as
        // crisp black / white / gray instead of slate + amber.
        brand: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#09090b",
          950: "#030304",
        },
        // Warm-neutral secondary kept for pending / muted surfaces.
        accent: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
        },
        navy: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#09090b",
          950: "#030304",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "sm-border": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        pop: "0 8px 30px -6px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
    },
  },
  plugins: [],
};
