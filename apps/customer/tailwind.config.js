/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porcelain: {
          50:  '#FBF6EB',
          100: '#F4ECDA',
          200: '#EDE4D0',
        },
        water: {
          50:  '#D4E3EB',
          100: '#B9D4DE',
          200: '#8FB4CC',
          300: '#6E98B5',
          500: '#5A7E99',
          700: '#3B5A70',
        },
        gold: {
          50:  '#F5EBCF',
          100: '#E8D9A0',
          200: '#D4B87A',
          500: '#C9A96E',
          600: '#B89565',
          700: '#8F7A4A',
        },
        ink: {
          500: '#2B3A45',
          700: '#1E2C35',
        },
        muted: '#6E7A85',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '32px',
        '3xl': '24px',
        '2xl': '20px',
      },
      boxShadow: {
        'soft':   '0 2px 8px rgba(43,58,69,0.06), 0 12px 24px rgba(43,58,69,0.04)',
        'float':  '0 6px 24px rgba(43,58,69,0.08), 0 20px 40px rgba(143,122,74,0.08)',
        'gold':   '0 6px 20px rgba(201,169,110,0.25), 0 2px 6px rgba(201,169,110,0.15)',
        'glass':  '0 8px 32px rgba(43,58,69,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #E8D9A0 0%, #C9A96E 50%, #8F7A4A 100%)',
        'gradient-porcelain': 'linear-gradient(180deg, #FBF6EB 0%, #F4ECDA 100%)',
        'gradient-water': 'linear-gradient(180deg, #D4E3EB 0%, #B9D4DE 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'scale-in': 'scale-in .3s ease-out both',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
