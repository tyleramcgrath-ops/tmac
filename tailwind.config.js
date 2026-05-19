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
          deeper: "#03061f",
          blue: "#0017FF",
          blue2: "#3a4cff",
          coral: "#FF4550",
          coral2: "#ff8a91",
          mist: "#F4F6FF",
          paper: "#FAFBFF",
          ink: "#0B1238",
          line: "#E3E6F5",
          muted: "#5A6386",
          soft: "#8A91B4",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(6, 13, 68, 0.16)",
        card: "0 24px 60px -24px rgba(6, 13, 68, 0.22)",
        glow: "0 30px 90px -20px rgba(0, 23, 255, 0.45)",
        coral: "0 24px 60px -20px rgba(255, 69, 80, 0.45)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        floatA: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-8px,0)" },
        },
        floatB: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,8px,0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        floatA: "floatA 6s ease-in-out infinite",
        floatB: "floatB 7s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        shine: "shine 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
