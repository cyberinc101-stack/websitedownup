/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        muted: "#5B6472",
        surface: "#FFFFFF",
        bg: "#F5F8FB",
        line: "#E2E8F1",
        signal: {
          DEFAULT: "#2F6FED",
          dark: "#1E4FC4",
          light: "#EAF1FF",
        },
        up: {
          DEFAULT: "#16A34A",
          bg: "#E9F8EF",
          line: "#BCE9CD",
        },
        down: {
          DEFAULT: "#E8542B",
          bg: "#FDEEE8",
          line: "#F7C7B6",
        },
        slow: {
          DEFAULT: "#D97706",
          bg: "#FEF3E2",
          line: "#F8DCA6",
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        body: ["system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(11,18,32,0.04), 0 1px 6px 0 rgba(11,18,32,0.05)",
        cardHover: "0 4px 14px 0 rgba(11,18,32,0.08)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-10%)" },
          "100%": { transform: "translateX(110%)" },
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.6" },
        },
      },
      animation: {
        sweep: "sweep 2.4s ease-in-out infinite",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
