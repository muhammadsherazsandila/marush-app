/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        marush: {
          primary: '#0B6259',
          'primary-light': '#19776C',
          'primary-dark': '#06473F',
          secondary: '#1D8B7E',
          'secondary-light': '#66B9A9',
          'secondary-dark': '#0F7468',
          background: '#F5F4EF',
          surface: '#FFFDF9',
          subtle: '#EEECE5',
          'primary-subtle': '#E2F0EB',
          border: '#E4E1D8',
          text: '#102A2A',
          muted: '#66726D',
          'muted-light': '#8A918A',
        },
        slate: {
          50: '#F5F4EF',
          100: '#EEECE5',
          200: '#E4E1D8',
          300: '#D4D1C8',
          400: '#8A918A',
          500: '#66726D',
          600: '#4F5E58',
          700: '#364842',
          800: '#213631',
          900: '#102A2A',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 10px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 24px 0 rgba(11, 98, 89, 0.10)',
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
