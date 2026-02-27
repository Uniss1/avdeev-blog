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
      typography: {
        black: {
          css: {
            '--tw-prose-body': '#000',
            '--tw-prose-headings': '#000',
            '--tw-prose-links': '#000',
            '--tw-prose-bold': '#000',
            '--tw-prose-counters': '#000',
            '--tw-prose-bullets': '#000',
            '--tw-prose-hr': '#000',
            '--tw-prose-quotes': '#000',
            '--tw-prose-quote-borders': '#000',
            '--tw-prose-code': '#000',
            '--tw-prose-pre-code': '#000',
            '--tw-prose-pre-bg': '#fff',
            '--tw-prose-th-borders': '#000',
            '--tw-prose-td-borders': '#000',
            'h1, h2, h3, h4': {
              fontFamily: 'Unbounded, sans-serif',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            },
            h2: {
              borderBottom: '2px solid #000',
              paddingBottom: '0.5rem',
              marginTop: '2.5em',
            },
            h3: {
              marginTop: '2em',
            },
            a: {
              color: '#000',
              textDecoration: 'underline',
              textDecorationThickness: '2px',
              textUnderlineOffset: '3px',
              fontWeight: '600',
              '&:hover': {
                backgroundColor: '#000',
                color: '#fff',
              },
            },
            blockquote: {
              borderLeftWidth: '4px',
              borderLeftColor: '#000',
              fontStyle: 'normal',
              fontFamily: '"Geist Mono", monospace',
              fontSize: '0.9em',
              backgroundColor: 'rgba(0,0,0,0.03)',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingRight: '1rem',
            },
            hr: {
              borderTop: '2px solid #000',
              marginTop: '2.5em',
              marginBottom: '2.5em',
            },
            'ul > li::marker': {
              color: '#000',
              fontWeight: '900',
            },
            'ol > li::marker': {
              color: '#000',
              fontWeight: '700',
              fontFamily: '"Geist Mono", monospace',
            },
            strong: {
              fontWeight: '800',
            },
            code: {
              fontFamily: '"Geist Mono", monospace',
              fontWeight: '500',
              backgroundColor: 'rgba(0,0,0,0.06)',
              padding: '0.15em 0.4em',
              borderRadius: '0',
              border: '1px solid rgba(0,0,0,0.15)',
              fontSize: '0.85em',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            table: {
              border: '2px solid #000',
            },
            'thead th': {
              fontFamily: '"Geist Mono", monospace',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontSize: '0.8em',
              letterSpacing: '0.05em',
              borderBottom: '2px solid #000',
            },
            'tbody td': {
              borderBottom: '1px solid rgba(0,0,0,0.15)',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
