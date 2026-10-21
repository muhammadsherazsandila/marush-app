/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        marush: {
          primary: "#019CDF", // Cerulean
          "primary-light": "#3BB4E8",
          "primary-dark": "#0177AA",
          secondary: "#8A8F98",
          background: "#0A0F1A", // Dark surface
          surface: "#121722", // Card surface
          border: "rgba(255,255,255,0.08)",
          text: "#F7F8F8",
          muted: "#8A8F98",
        },
      },
    },
  },
  plugins: [],
};
