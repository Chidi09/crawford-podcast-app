// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crawfordBlue: '#0A1A2A', // Updated to your deep blue
        crawfordGold: {
          DEFAULT: '#E8AF49',
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FFE79E',
          300: '#FFDB78',
          400: '#FFCF52',
          500: '#E8AF49',
          600: '#C9933B',
          700: '#AA772D',
          800: '#8B5B20',
          900: '#6C3F13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}