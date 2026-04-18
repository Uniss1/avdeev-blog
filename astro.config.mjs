import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://avdeev.blog',
  integrations: [
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
