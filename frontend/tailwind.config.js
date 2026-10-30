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
        cyber: {
          dark: '#0a0d14',
          card: '#111726',
          border: '#1f2a40',
          accent: '#06b6d4', // cyan-500
          accentBlue: '#3b82f6', // blue-500
          glow: '#0891b2',
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
          info: '#06b6d4',
          success: '#10b981',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
