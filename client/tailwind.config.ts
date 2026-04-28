import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'sans-serif'],
        thai: ['Noto Sans Thai', 'sans-serif'],
      },
      colors: {
        card: {
          red: '#DC2626',
          blue: '#2563EB',
          neutral: '#9CA3AF',
          traitor: '#111827',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
