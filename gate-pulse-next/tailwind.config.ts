import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default <Config>{
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@shadcn/ui/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003B8E',
        secondary: '#0057D8',
        gold: '#D4AF37',
        lightGray: '#F6F8FB',
        darkNavy: '#0B1E3D',
      },
      fontFamily: {
        sans: ['Inter var', ...fontFamily.sans],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
