import type { Config } from 'tailwindcss';

// Colours resolve through CSS variables (space-separated RGB channels) so the same
// token names theme via [data-theme] and Tailwind's /alpha syntax (bg-surface/85) works.
// Non-colour tokens (font/size/spacing/radius) never change per theme → static here.
const c = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const colorTokens = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'error', 'on-error', 'error-container', 'on-error-container',
  'background', 'on-background',
  'surface', 'on-surface', 'surface-variant', 'on-surface-variant',
  'surface-dim', 'surface-bright',
  'surface-container-lowest', 'surface-container-low', 'surface-container',
  'surface-container-high', 'surface-container-highest',
  'outline', 'outline-variant',
  'inverse-surface', 'inverse-on-surface', 'inverse-primary',
  'surface-tint',
];

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(colorTokens.map((t) => [t, c(t)])),
      fontFamily: {
        quran: ['"Amiri Quran"', 'Amiri', 'serif'],
        title: ['Amiri', 'serif'],
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'quran-verse-lg': ['32px', { lineHeight: '68px', fontWeight: '400' }],
        'quran-verse-lg-mobile': ['24px', { lineHeight: '52px', fontWeight: '400' }],
        'quran-verse-md': ['22px', { lineHeight: '46px', fontWeight: '400' }],
        'surah-title': ['28px', { lineHeight: '40px', fontWeight: '700' }],
        'display-lg': ['26px', { lineHeight: '36px', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '30px', fontWeight: '600' }],
        'headline-sm': ['17px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.03em', fontWeight: '500' }],
      },
      spacing: {
        'space-2xs': '0.25rem',
        'space-xs': '0.5rem',
        'space-sm': '0.75rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'space-2xl': '3rem',
        'gutter-mobile': '1rem',
        'gutter-desktop': '2rem',
      },
      maxWidth: { 'max-content-width': '780px' },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
    },
  },
  plugins: [],
} satisfies Config;
