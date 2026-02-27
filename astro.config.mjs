import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://uniss1.github.io',
  base: '/avdeev-blog',
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/rss.xml'),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      langs: ['sql', 'python', 'javascript', 'typescript', 'yaml', 'bash', 'json'],
    },
  },
});
