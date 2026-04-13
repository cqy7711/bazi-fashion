/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 多巴胺色系
        coral: { DEFAULT: '#FF6B9D', light: 'rgba(255,107,157,0.1)', dark: '#E8507A' },
        orange: { DEFAULT: '#FF9D6B', light: 'rgba(255,157,107,0.1)' },
        yellow: { DEFAULT: '#FFD666', light: 'rgba(255,214,102,0.12)' },
        green: { DEFAULT: '#6BFF9D', light: 'rgba(107,255,157,0.1)' },
        blue: { DEFAULT: '#6BD4FF', light: 'rgba(107,212,255,0.1)' },
        purple: { DEFAULT: '#9D6BFF', light: 'rgba(157,107,255,0.1)' },
        // 文字
        text: { DEFAULT: '#1A1A2E', secondary: '#6B7280', muted: '#A0A8C0' },
        // 五行
        wuxing: {
          wood: '#00C47A', fire: '#FF6B6B', earth: '#D4A000',
          metal: '#7B8FA8', water: '#00A8E8',
        },
      },
      fontFamily: {
        outfit: ['Outfit', '-apple-system', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'coral': '0 4px 16px rgba(255,107,157,0.3)',
        'coral-lg': '0 8px 32px rgba(255,107,157,0.35)',
        'card': '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'float': 'float 6s ease-in-out infinite',
        'wiggle': 'wiggle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};
