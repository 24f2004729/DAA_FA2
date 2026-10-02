export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1F4E79', light: '#2563EB', dark: '#14385A' },
        secondary: { DEFAULT: '#2A7F7F', light: '#3AAEAE', dark: '#1D5A5A' },
        canvas: '#F7F9FC',
        border: '#D9E0E7',
        charcoal: '#2A3038',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
