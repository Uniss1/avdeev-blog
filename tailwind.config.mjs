/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Geist', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
