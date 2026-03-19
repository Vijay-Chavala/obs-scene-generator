/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["DM Sans", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#0f172a",
        accent: "#0f766e",
        parchment: "#f6f1ea",
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.15)",
      },
    },
  },
  plugins: [],
};
