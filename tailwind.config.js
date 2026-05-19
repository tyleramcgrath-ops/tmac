/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        centris: {
          deep: "#060D44",
          blue: "#0017FF",
          coral: "#FF4550",
          mist: "#F4F6FF",
          ink: "#0B1238",
          muted: "#5A6386",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(6, 13, 68, 0.18)",
        glow: "0 30px 80px -20px rgba(0, 23, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
