/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'hind-madurai': ['Hind Madurai', 'sans-serif']
      },
      colors: {
        'tamil-yellow': {
          50: '#FFF9E5',
          100: '#FFF3CC',
          200: '#FFEB99'
        },
        'tamil-indigo': {
          600: '#4338ca',
          700: '#3730a3'
        }
      }
    },
  },
  plugins: [],
}