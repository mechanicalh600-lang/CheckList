
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        primary: '#1e293b', // Slate 800
        dark: '#0f172a',    // Slate 900
        accent: '#0ea5e9',  // Sky 500
        sabanour: '#7f1d1d', // Deep Red
        chadormalu: '#be185d', // Pink/Magenta
        success: '#10b981',
        danger: '#ef4444',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
}
