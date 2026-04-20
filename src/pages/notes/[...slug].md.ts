import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  const notes = await getCollection('notes');
  return notes.map((note) => ({
    params: { slug: note.slug },
    props: { note },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const { note } = props as { note: Awaited<ReturnType<typeof getCollection>>[number] };
  const { title, date, description, tags, category } = note.data;

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${date.toISOString().slice(0, 10)}`,
    category ? `category: ${JSON.stringify(category)}` : null,
    tags?.length ? `tags: [${tags.map((t: string) => JSON.stringify(t)).join(', ')}]` : null,
    description ? `description: ${JSON.stringify(description)}` : null,
    `canonical: https://avdeev.blog/notes/${note.slug}/`,
    '---',
  ].filter((line): line is string => line !== null).join('\n');

  return new Response(`${frontmatter}\n\n${note.body}`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
