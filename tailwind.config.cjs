/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Тёплая бумажная основа вместо холодного цинка
        paper: '#faf9f6',
        ink: {
          DEFAULT: '#1c1a17',
          soft: '#3b3733',
          muted: '#6b6559',
          faint: '#9a9387',
        },
        // Единственный акцент — глина. Без градиентов и свечения.
        clay: {
          50: '#fdf5ef',
          100: '#f9e7da',
          200: '#f0cfba',
          300: '#e3b191',
          400: '#d18a60',
          500: '#bd6b3f',
          600: '#a2532c',
          700: '#864324',
          800: '#6e381f',
          900: '#5b2f1c',
        },
        // Второстепенные акценты для видов занятий и графиков
        moss: {
          100: '#eef1e6',
          300: '#b9c4a5',
          500: '#6b7f4b',
          600: '#586a3c',
          700: '#465533',
        },
        steel: {
          100: '#e9eef1',
          300: '#a9bcc5',
          500: '#4a6572',
          600: '#3d5563',
          700: '#324651',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 26, 23, 0.04)',
        pop: '0 16px 40px -16px rgba(28, 26, 23, 0.28)',
      },
    },
  },
  plugins: [],
}
