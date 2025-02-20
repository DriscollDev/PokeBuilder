/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,ejs}",
    "./views/**/*.{js,jsx,ts,tsx,ejs}"
  ],
  theme: {
    extend: {
      fontFamily: {
        kode: ['Kode-Mono', 'monospace'],
        quantico: ['Quantico', 'monospace']

      },
    },
  },
  plugins: [],
};