/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        role: {
          sales: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
          dispatcher: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
          guide: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
          catering: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
          finance: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
        },
      },
    },
  },
  plugins: [],
};
