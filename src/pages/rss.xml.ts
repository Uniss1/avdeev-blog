import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_NAME, SITE_DESCRIPTION } from '../consts';

export async function GET(context: { site: URL }) {
  const notes = (await getCollection('notes'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.date,
      description: note.data.description ?? '',
      link: `/notes/${note.slug}/`,
    })),
  });
}
