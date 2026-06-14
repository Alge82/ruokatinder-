/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Finnish summer palette
        birch: {
          50: '#FBFAF5',
          100: '#F5F2E8',
          200: '#E8E2CF',
        },
        sky: {
          soft: '#B8D4E8',
          mid: '#6B9BD2',
          deep: '#3E6FA3',
        },
        leaf: {
          50: '#F0F4EA',
          200: '#C6D4B0',
          400: '#8FAA7A',
          600: '#5F7A4D',
          800: '#3D5232',
        },
        sun: {
          200: '#FCE9B0',
          400: '#F4C95D',
          600: '#D9A634',
        },
        berry: {
          400: '#D45D5D',
          600: '#A33E3E',
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(60, 80, 50, 0.08), 0 1px 3px -1px rgba(60, 80, 50, 0.06)',
        lift: '0 8px 24px -8px rgba(60, 80, 50, 0.15), 0 2px 6px -2px rgba(60, 80, 50, 0.08)',
      },
    },
  },
  plugins: [],
}
