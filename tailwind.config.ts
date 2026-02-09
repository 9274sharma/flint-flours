import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "#fefdfb",
          100: "#fdf9f4",
          200: "#f9f0e6",
          300: "#f4e6d4",
          400: "#edd9c2",
        },
        peach: { 100: "#fae6d1", 200: "#f4d4b8", 300: "#e8b896", 400: "#e4a574" },
        wheat: { 400: "#c4a574", 500: "#a67c52", 600: "#8b6914" },
        stone: { 600: "#57534e", 750: "#3d3632", 850: "#2a2522", 950: "#1a1715" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":
          "linear-gradient(180deg, transparent 0%, rgba(254,253,251,0.15) 25%, rgba(253,249,244,0.9) 100%)",
        "gradient-cta":
          "linear-gradient(135deg, #2a2522 0%, #3d3632 50%, #1a1715 100%)",
        "gradient-why-no":
          "linear-gradient(135deg, #fae6d1 0%, #f4d4b8 50%, #e8b896 100%)",
        "gradient-warm":
          "linear-gradient(180deg, #fefdfb 0%, #fdf9f4 50%, #f9f0e6 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-lg": "0 8px 40px 0 rgba(0, 0, 0, 0.12)",
        "glass-border": "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
