/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 This tells Tailwind to watch all components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
