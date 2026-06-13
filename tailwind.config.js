/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brownie: {
          50:  '#fdf6ee',
          100: '#f9e8cf',
          200: '#f2cf9b',
          300: '#e9af60',
          400: '#e0913a',
          500: '#d4741f',
          600: '#bc5c17',
          700: '#9c4516',
          800: '#7e3818',
          900: '#682f16',
          950: '#3a1608',
        }
      }
    },
  },
  plugins: [],
}
