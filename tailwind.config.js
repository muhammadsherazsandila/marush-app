/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        marush: {
          primary: '#004F42',
          'primary-light': '#086354',
          'primary-dark': '#00362D',
          secondary: '#16BAAF',
          'secondary-light': '#43D3C9',
          'secondary-dark': '#0D8E85',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          'primary-subtle': '#EAF4F1',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
          'muted-light': '#94A3B8',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 10px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 24px 0 rgba(0, 79, 66, 0.08)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
