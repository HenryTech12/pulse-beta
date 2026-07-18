/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F7F1',
          100: '#C2EDE0',
          200: '#8FDDC4',
          300: '#54C9A4',
          400: '#22B388',
          500: '#00A86B',
          600: '#008F5A',
          700: '#007249',
          800: '#005A3A',
          900: '#003D27',
        },
        ink: {
          50: '#F7F8FA',
          100: '#EFF1F4',
          200: '#E2E5EA',
          300: '#C9CED6',
          400: '#9AA1AC',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        cardHover: '0 4px 12px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.06)',
        panel: '0 -8px 32px rgba(16,24,40,0.12)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(0,168,107,0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(0,168,107,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,168,107,0)' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.2s ease-out',
        fadeIn: 'fadeIn 0.15s ease-out',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
