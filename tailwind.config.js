/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'float-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.8)'
          },
          '20%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
          '80%': {
            opacity: '1',
            transform: 'translateY(-20px) scale(1)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-40px) scale(0.8)'
          }
        }
      },
      animation: {
        'float-up': 'float-up 1.5s ease-out'
      }
    }
  },
  plugins: []
};