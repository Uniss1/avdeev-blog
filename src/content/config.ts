import { defineCollection, z } from 'astro:content';

const notesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(200),
    date: z.coerce.date(),
    category: z.enum(['BI', 'AI', 'Инженерия']).or(z.string().min(1)),
    tags: z.array(z.string().min(1)).min(1).max(10),
    type: z.enum(['Техническое', 'Эксперимент', 'Лучшая практика']).or(z.string().min(1)),
    description: z.string().max(160).optional(),
    metrics: z.object({
      label: z.string(),
      before: z.number().nullable().optional(),
      after: z.number().nullable().optional(),
      value: z.number().nullable().optional(),
    }).nullable().optional(),
  }),
});

export const collections = {
  notes: notesCollection,
};
