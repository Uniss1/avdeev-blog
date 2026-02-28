# Phase 3: Content & Pages — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all content pages and migrate 3 notes from the HTML prototype into Astro content collections, completing the blog's core reading experience.

**Architecture:** Static Astro pages using `getCollection('notes')` to query MDX content. 4 page routes (index, notes list, tag filter, note detail) + 3 MDX content files. All pages use existing BaseLayout + existing components (NoteCard, BackButton, BujoBox, TagBadge).

**Tech Stack:** Astro 5, MDX (@astrojs/mdx), Tailwind CSS, existing component library

**Issues:** #1, #2, #5, #8, #11, #14, #17

---

## Task 1: Add MDX integration

**Why:** Issues require `.mdx` files for HTML+Tailwind inside content (bujo-box, grid layouts, checklists). Astro needs `@astrojs/mdx` for this.

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`

**Step 1: Install @astrojs/mdx**

Run: `npm install @astrojs/mdx`

**Step 2: Add MDX to Astro config**

In `astro.config.mjs`, add the import and integration:

```javascript
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with 0 errors

**Step 4: Commit**

```
feat: add MDX integration (#1, #2, #5)
```

---

## Task 2: Migrate note — "Хаки для оптимизации в 1С Аналитике"

**Issue:** #1
**Files:**
- Create: `src/content/notes/haki-dlya-optimizacii-v-1c-analitike.mdx`

**Step 1: Create the MDX file**

Source: `Сайт3.html` → `db.notes[0]`

```mdx
---
title: "Хаки для оптимизации в 1С Аналитике"
date: 2024-05-15
category: "BI"
tags: ["1C-Analytics", "SQL", "Оптимизация"]
type: "Техническое"
description: "Борьба с задержками при рендеринге дашбордов на больших объемах данных."
metrics:
  label: "Время запроса (мс)"
  before: 4500
  after: 320
---

Контекст: Борьба с задержками при рендеринге дашбордов на больших объемах данных.

<div class="bujo-box p-6 mb-8">
  <h3 class="font-display font-bold uppercase text-xl mb-4 border-b-2 border-black pb-2 inline-block">Решения</h3>
  <ul class="font-sans space-y-3 mt-4">
    <li class="flex items-start gap-3">
      <div class="mt-1 w-3 h-3 border-2 border-black bg-black flex-shrink-0"></div>
      <span>Материализованные представления обязательны для тяжелых отчетов.</span>
    </li>
    <li class="flex items-start gap-3">
      <div class="mt-1 w-3 h-3 border-2 border-black bg-black flex-shrink-0"></div>
      <span>Индексирование на уровне PostgreSQL (1С не всегда создает оптимальные запросы).</span>
    </li>
    <li class="flex items-start gap-3">
      <div class="mt-1 w-3 h-3 border-2 border-black flex-shrink-0"></div>
      <span>Ограничение исторических данных на уровне источника.</span>
    </li>
  </ul>
</div>

<div class="bujo-box relative">
  <div class="bg-black text-white p-2 font-mono text-xs font-bold border-b-2 border-black">SQL_SNIPPET.sql</div>

```sql
SELECT
  Dimension1,
  SUM(Measure1) as Total
FROM DataLake.FactTable
WHERE Period >= '2024-01-01'
GROUP BY Dimension1
```

</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, note is in the collection

**Step 3: Commit**

```
feat: add note "Хаки для оптимизации в 1С Аналитике" (#1)
```

---

## Task 3: Migrate note — "Локальные LLM-агенты для анализа документов"

**Issue:** #2
**Files:**
- Create: `src/content/notes/lokalnye-llm-agenty-dlya-analiza-dokumentov.mdx`

**Step 1: Create the MDX file**

Source: `Сайт3.html` → `db.notes[1]`

```mdx
---
title: "Локальные LLM-агенты для анализа документов"
date: 2024-05-10
category: "AI"
tags: ["AI-Агенты", "LLM", "Python"]
type: "Эксперимент"
description: "RAG-пайплайн, который не отправляет корпоративные данные во внешние API."
metrics:
  label: "Токенов/Сек"
  value: 45
---

Цель: Создать RAG-пайплайн, который не отправляет корпоративные данные во внешние API.

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  <div class="bujo-box p-4">
    <div class="text-center font-display font-bold uppercase text-sm md:text-base border-b-2 border-black pb-2 mb-4">Технологический стек</div>
    <ul class="font-mono text-sm space-y-2">
      <li>- Ollama (Llama 3 8B)</li>
      <li>- LangChain</li>
      <li>- ChromaDB</li>
    </ul>
  </div>
  <div class="bujo-box p-4">
    <div class="text-center font-display font-bold uppercase text-sm md:text-base border-b-2 border-black pb-2 mb-4">Результат</div>
    <p class="font-sans text-sm text-center mt-4">Скорость ~45 ток/с на M2 Max. Достаточно для комфортного чтения.</p>
  </div>
</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```
feat: add note "Локальные LLM-агенты для анализа документов" (#2)
```

---

## Task 4: Migrate note — "Паттерны пайплайнов в Airflow"

**Issue:** #5
**Files:**
- Create: `src/content/notes/patterny-pipelinov-v-airflow.mdx`

**Step 1: Create the MDX file**

Source: `Сайт3.html` → `db.notes[2]`

```mdx
---
title: "Паттерны пайплайнов в Airflow"
date: 2024-04-20
category: "Инженерия"
tags: ["Пайплайны-данных", "ETL", "Airflow"]
type: "Лучшая практика"
description: "Обеспечение идемпотентности в ежедневных загрузках (ETL)."
---

Обеспечение идемпотентности в ежедневных загрузках (ETL).

<div class="bujo-box mb-8">
  <div class="bg-black text-white p-2 text-center font-display font-bold uppercase text-lg tracking-widest">Чек-лист</div>
  <div class="p-6">
    <ul class="space-y-4 font-mono text-sm">
      <li class="flex items-center gap-3">
        <div class="w-4 h-4 border-2 border-black flex items-center justify-center font-bold text-xs">X</div>
        Использовать logical_date вместо datetime.now()
      </li>
      <li class="flex items-center gap-3">
        <div class="w-4 h-4 border-2 border-black flex items-center justify-center font-bold text-xs">X</div>
        Паттерн DELETE-INSERT перед загрузкой
      </li>
      <li class="flex items-center gap-3">
        <div class="w-4 h-4 border-2 border-black"></div>
        По умолчанию Catchup=False
      </li>
    </ul>
  </div>
</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```
feat: add note "Паттерны пайплайнов в Airflow" (#5)
```

---

## Task 5: Homepage — Overview page

**Issue:** #8
**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Implement the homepage**

Replace current `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { formatDate } from '../utils/date';

const notes = (await getCollection('notes'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 10);

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
---

<BaseLayout title="Обзор">
  <div class="max-w-5xl mx-auto">
    <div class="mb-12 text-center">
      <h1 class="font-display font-black uppercase tracking-tight text-5xl md:text-7xl text-black">
        Обзор
      </h1>
    </div>

    <div class="bujo-box">
      <div class="bujo-header-box p-3 text-center">
        <h2 class="font-display font-bold uppercase text-2xl tracking-wide">Недавние записи</h2>
      </div>
      <div class="p-6">
        <ul class="space-y-4 font-sans font-medium">
          {notes.map((note) => (
            <li>
              <a
                href={`${base}notes/${note.slug}/`}
                class="flex items-center gap-4 group"
              >
                <div class="w-3 h-3 rounded-full bg-black group-hover:scale-150 transition-transform flex-shrink-0"></div>
                <span class="flex-1 group-hover:underline decoration-2 underline-offset-4">
                  {note.data.title}
                </span>
                <span class="font-mono text-sm border-b-2 border-black pb-0.5">
                  {formatDate(note.data.date, 'short')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, `/avdeev-blog/index.html` generated

**Step 3: Commit**

```
feat: implement homepage with recent notes (#8)
```

---

## Task 6: All Notes page

**Issue:** #11
**Files:**
- Create: `src/pages/notes/index.astro`

**Step 1: Create the notes listing page**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import NoteCard from '../../components/NoteCard.astro';
import { getCollection } from 'astro:content';

const notes = (await getCollection('notes'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---

<BaseLayout title="Все записи">
  <div class="max-w-4xl mx-auto pt-8">
    <div class="mb-12 text-center">
      <h1 class="font-display font-black uppercase text-4xl md:text-5xl text-black inline-block border-b-4 border-black pb-2 px-8">
        Все записи
      </h1>
    </div>

    <div class="space-y-6">
      {notes.map((note) => (
        <NoteCard note={note} />
      ))}
    </div>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, `/avdeev-blog/notes/index.html` generated

**Step 3: Commit**

```
feat: add all notes listing page (#11)
```

---

## Task 7: Tag filter page

**Issue:** #14
**Files:**
- Create: `src/pages/tags/[tag].astro`

**Step 1: Create the dynamic tag page**

Reference: `src/utils/transliterate.ts` for slug generation, `src/components/TagBadge.astro` for link format.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import NoteCard from '../../components/NoteCard.astro';
import { getCollection } from 'astro:content';
import { transliterate } from '../../utils/transliterate';

export async function getStaticPaths() {
  const notes = await getCollection('notes');
  const tagMap = new Map<string, { tag: string; slug: string }>();

  notes.forEach((note) => {
    note.data.tags.forEach((tag: string) => {
      const slug = transliterate(tag);
      if (!tagMap.has(slug)) {
        tagMap.set(slug, { tag, slug });
      }
    });
  });

  return Array.from(tagMap.values()).map(({ tag, slug }) => ({
    params: { tag: slug },
    props: { originalTag: tag },
  }));
}

interface Props {
  originalTag: string;
}

const { originalTag } = Astro.props;

const notes = (await getCollection('notes'))
  .filter((note) => note.data.tags.includes(originalTag))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---

<BaseLayout title={`Тема: #${originalTag}`}>
  <div class="max-w-4xl mx-auto pt-8">
    <div class="mb-12 text-center">
      <h1 class="font-display font-black uppercase text-4xl md:text-5xl text-black inline-block border-b-4 border-black pb-2 px-8">
        Тема: #{originalTag}
      </h1>
    </div>

    <div class="space-y-6">
      {notes.map((note) => (
        <NoteCard note={note} />
      ))}
    </div>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, tag pages generated for each unique tag (e.g., `/avdeev-blog/tags/1c-analytics/index.html`)

**Step 3: Commit**

```
feat: add tag filter pages (#14)
```

---

## Task 8: Note detail page

**Issue:** #17
**Files:**
- Create: `src/pages/notes/[...slug].astro`

**Step 1: Create the note detail page**

Reference: `Сайт3.html` → `router.renderDetail()` for layout. Uses BackButton, black header with white text, tags, prose body.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import BackButton from '../../components/BackButton.astro';
import { getCollection } from 'astro:content';
import { formatDate } from '../../utils/date';

export async function getStaticPaths() {
  const notes = await getCollection('notes');
  return notes.map((note) => ({
    params: { slug: note.slug },
    props: { note },
  }));
}

const { note } = Astro.props;
const { Content } = await note.render();
const dateFormatted = formatDate(note.data.date, 'full');
---

<BaseLayout title={note.data.title} description={note.data.description}>
  <div class="max-w-3xl mx-auto pt-8 pb-20">
    <BackButton />

    <article class="bujo-box">
      <header class="bujo-header-box p-8 md:p-12 bg-black text-white text-center">
        <div class="font-mono text-sm tracking-[0.3em] uppercase mb-6 border-b border-white/30 pb-4 inline-block">
          Запись // {dateFormatted}
        </div>
        <h1 class="font-display font-black uppercase text-3xl md:text-5xl leading-tight mb-6">
          {note.data.title}
        </h1>
        <div class="flex justify-center flex-wrap gap-3">
          {note.data.tags.map((tag: string) => (
            <span class="font-mono text-xs border border-white px-3 py-1 bg-white text-black font-bold">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <div class="p-8 md:p-12 prose prose-black max-w-none">
        <Content />
      </div>
    </article>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, 3 note detail pages generated

**Step 3: Verify full site**

Run: `npm run build && npm run preview`
Expected: All routes work:
- `/avdeev-blog/` — Overview with 3 recent notes
- `/avdeev-blog/notes/` — All 3 notes as NoteCards
- `/avdeev-blog/tags/sql/` — Filtered notes
- `/avdeev-blog/notes/haki-dlya-optimizacii-v-1c-analitike/` — Full note

**Step 4: Commit**

```
feat: add note detail page (#17)
```

---

## Task 9: Close issues

**Step 1:** Close all 7 phase 3 issues:

```bash
gh issue close 1 --comment "Implemented in phase 3"
gh issue close 2 --comment "Implemented in phase 3"
gh issue close 5 --comment "Implemented in phase 3"
gh issue close 8 --comment "Implemented in phase 3"
gh issue close 11 --comment "Implemented in phase 3"
gh issue close 14 --comment "Implemented in phase 3"
gh issue close 17 --comment "Implemented in phase 3"
```

---

## Dependency Order

```
Task 1 (MDX setup) → Tasks 2,3,4 (content, parallel) → Tasks 5,6,7,8 (pages, parallel) → Task 9 (close issues)
```

Tasks 2-4 can run in parallel. Tasks 5-8 can run in parallel (they depend on content existing but not on each other).
