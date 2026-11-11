/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trading: {
          bg: "#0B0E14",
          card: "#121824",
          surface: "#1A2234",
          border: "#232E47",
          bullish: "#10B981", // Green for above DMA
          bearish: "#EF4444", // Red for below DMA
          neutral: "#64748B", // Slate neutral
          accent: "#38BDF8",  // Sky accent
        }
      }
    },
  },
  plugins: [],
}
