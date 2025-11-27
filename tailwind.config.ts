import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class', // 자동 다크모드 비활성화 (class 기반으로만 작동)
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          darker: '#1e40af',
        },
        secondary: '#64748b',
        accent: '#f59e0b',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      },
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '0.75rem',   // 12px
        'lg': '1rem',      // 16px
        'xl': '1.5rem',    // 24px
        '2xl': '2rem',     // 32px
        '3xl': '3rem',     // 48px
      },
      height: {
        'input': '2.5rem',    // 40px
        'button': '2.5rem',   // 40px
      },
      minHeight: {
        'input': '2.5rem',    // 40px
        'button': '2.5rem',   // 40px
      },
      fontFamily: {
        'sans': ['Pretendard', 'Malgun Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
