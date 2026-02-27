# Release Execution: Tech Knowledge Base (Строгий Цифровой Сад) — v1.0

> **Дата составления:** 2026-02-27
> **Release Engineer:** AI-ассистент (Claude Code)
> **Модель разработки:** Соло-разработчик + AI-ассистент
> **Целевой хостинг:** GitHub Pages (бесплатный, HTTPS, CDN от Fastly)
> **Исходные артефакты:** 01-product-analysis.md .. 08-release-plan.md, Concept.md, Сайт3.html

---

## Pre-Release Checklist

### Критические требования (блокируют релиз)

- [ ] Все 13 MUST stories реализованы, собираются без ошибок и визуально верифицированы
- [ ] Все 7 TECH stories реализованы и функционируют
- [ ] QA-отчет: ноль критических проблем (CRIT-1, CRIT-2, CRIT-3 устранены)
- [ ] CRIT-1 устранен: 9 тегов зафиксировано как эталон, противоречие в документации исправлено
- [ ] CRIT-2 устранен: `deploy.yml` содержит минимальные permissions, фиксированные версии Actions, `npm ci`
- [ ] CRIT-3 устранен: тест на `<script>` в MDX-контенте пройден — скрипт экранируется Astro/remark
- [ ] MAJ-1 разрешен: `<h1>` только в основном контенте, sidebar использует `<div>` для "Индекс"
- [ ] MAJ-5 устранен: год в NoteCard — динамический через `note.data.date.getFullYear()`
- [ ] Zod-валидация frontmatter: сборка падает при невалидных данных
- [ ] Три записи мигрированы из прототипа и корректно отображаются на всех маршрутах
- [ ] Адаптивная верстка работает на viewport 375px
- [ ] XSS через MDX-контент невозможен
- [ ] Нулевой client-side JavaScript (кроме inline-скрипта мобильного sidebar)
- [ ] CI/CD pipeline: push в `main` автоматически деплоит сайт

### Желательные требования (не блокируют, рекомендуются)

- [ ] Все 6 SHOULD stories реализованы (SEO, Shiki, prose, RSS, 404)
- [ ] Lighthouse Performance >= 90 на десктопе и мобильных
- [ ] Lighthouse Accessibility >= 95
- [ ] Lighthouse SEO >= 95
- [ ] LCP < 1.5s, CLS < 0.05, TTFB < 200ms
- [ ] Total page weight < 500 KB (HTML + CSS + шрифты)
- [ ] Семантическая HTML-разметка: nav, main, article, aside, header, time
- [ ] Все шрифты загружаются только как self-hosted woff2

### Предварительные условия окружения

- [ ] Node.js >= 20 LTS установлен (`node --version`)
- [ ] npm >= 10 установлен (`npm --version`)
- [ ] Git установлен и настроен (`git --version`)
- [ ] GitHub аккаунт с включенной 2FA
- [ ] SSH-ключ или HTTPS-токен настроен для GitHub
- [ ] Домен / base path определен и зафиксирован

---

## Release Procedure

### Step 1: Инициализация Astro-проекта (Story 1.1)

```bash
cd /home/dmin/projects/avdeev.blog

# Инициализация Astro-проекта (пустой шаблон)
npm create astro@latest . -- --template minimal --no-git --typescript strict

# Установка основных зависимостей
npm install @astrojs/tailwind @astrojs/sitemap @astrojs/rss
npm install tailwindcss @tailwindcss/typography
npm install lucide-astro

# Установка dev-зависимостей для тестирования (опционально для v1)
npm install -D vitest playwright @playwright/test
```

**Ожидаемый результат:**
- Файлы `package.json`, `astro.config.mjs`, `tsconfig.json` созданы в корне проекта
- Директория `src/` с базовой структурой создана
- `npm run dev` запускает dev-сервер на `http://localhost:4321` без ошибок

### Step 2: Инициализация Git-репозитория (Story 1.3)

```bash
cd /home/dmin/projects/avdeev.blog

# Инициализация (если еще нет)
git init

# Создание .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/

# Build output
dist/

# Astro
.astro/

# Environment
.env
.env.*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
GITIGNORE

# Первый коммит
git add .
git commit -m "feat: инициализация Astro-проекта (Story 1.1, 1.3)"

# Создание репозитория на GitHub и привязка
gh repo create avdeev.blog --public --source=. --remote=origin
git push -u origin main
```

**Ожидаемый результат:**
- Локальный Git-репозиторий создан
- Удаленный репозиторий на GitHub создан и связан
- Первый коммит содержит базовую структуру Astro-проекта
- `.gitignore` исключает `node_modules/`, `dist/`, `.astro/`

### Step 3: Настройка конфигурации Astro (Story 1.1)

Файл: `/home/dmin/projects/avdeev.blog/astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://<username>.github.io',
  base: '/<repo>',
  integrations: [
    tailwind(),
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

> **РЕШЕНИЕ:** Заменить `<username>` и `<repo>` на реальные значения при реализации. Если репозиторий назван `<username>.github.io`, то `base` не нужен.

Файл: `/home/dmin/projects/avdeev.blog/tailwind.config.mjs`

```javascript
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
```

**Ожидаемый результат:**
- `npm run dev` запускается без ошибок
- Tailwind CSS подключен и распознает кастомные шрифты
- Sitemap генерируется при сборке, исключая `/404` и `/rss.xml`
- Shiki подсветка настроена для целевых языков

### Step 4: Создание структуры проекта (TECH-2, TECH-3, TECH-4, TECH-1)

```bash
cd /home/dmin/projects/avdeev.blog

# Создание директорий
mkdir -p src/components
mkdir -p src/content/notes
mkdir -p src/layouts
mkdir -p src/pages/notes
mkdir -p src/pages/tags
mkdir -p src/styles
mkdir -p src/utils
mkdir -p public/fonts
mkdir -p .github/workflows
```

Файлы для создания:

**`src/consts.ts`** (TECH-3):
```typescript
export const SITE_NAME = 'Tech Knowledge Base';
export const SITE_DESCRIPTION = 'Публичная техническая база знаний: архитектурные решения, оптимизация, пайплайны данных, AI-агенты.';
export const SITE_URL = 'https://<username>.github.io/<repo>';
export const AUTHOR_NAME = '<имя автора>';
export const DEFAULT_OG_IMAGE = '/og-default.png';
```

**`src/utils/transliterate.ts`** (TECH-1):
```typescript
const CYRILLIC_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
};

export function transliterate(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .split('')
    .map(char => CYRILLIC_MAP[char] ?? char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

**`src/utils/date.ts`** (утилита форматирования дат):
```typescript
export function formatDate(date: Date, format: 'short' | 'full' = 'short'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (format === 'short') return `${day}.${month}`;
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
```

**`src/styles/global.css`** (TECH-4):
```css
/* Точечная сетка */
body {
  background-color: #ffffff;
  background-image: radial-gradient(#d1d5db 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  color: #000000;
  background-position: 0 0;
}

/* Контейнер bujo-box */
.bujo-box {
  border: 2px solid #000000;
  background-color: rgba(255, 255, 255, 0.95);
}

.bujo-header-box {
  border-bottom: 2px solid #000000;
}

/* Строгий скроллбар */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #000000; }
::-webkit-scrollbar-thumb:hover { background: #333333; }

/* Имитация линовки (зарезервировано для v2) */
.lined-paper {
  background-image: repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px);
  line-height: 32px;
}

/* Инверсия при выделении текста */
::selection {
  background-color: #000;
  color: #fff;
}
```

**Ожидаемый результат:**
- Структура директорий соответствует архитектуре из `03-architecture.md`
- Все утилиты экспортируют нужные функции
- Импорт `import { transliterate } from '../utils/transliterate'` работает в TypeScript

### Step 5: Подключение self-hosted шрифтов (TECH-2)

```bash
cd /home/dmin/projects/avdeev.blog

# Вариант A: Через npm-пакеты @fontsource
npm install @fontsource/geist @fontsource/geist-mono @fontsource-variable/unbounded

# Вариант B: Скачать woff2-файлы вручную и разместить:
# public/fonts/Geist-Regular.woff2
# public/fonts/Geist-Medium.woff2
# public/fonts/Geist-Bold.woff2
# public/fonts/GeistMono-Regular.woff2
# public/fonts/GeistMono-Bold.woff2
# public/fonts/Unbounded-Bold.woff2
# public/fonts/Unbounded-Black.woff2
```

При варианте B добавить в `src/styles/global.css`:

```css
@font-face {
  font-family: 'Geist';
  src: url('/fonts/Geist-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Geist';
  src: url('/fonts/Geist-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Geist';
  src: url('/fonts/Geist-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Geist Mono';
  src: url('/fonts/GeistMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Geist Mono';
  src: url('/fonts/GeistMono-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Unbounded';
  src: url('/fonts/Unbounded-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Unbounded';
  src: url('/fonts/Unbounded-Black.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
```

> **РЕШЕНИЕ:** Рекомендуется вариант B (self-hosted woff2 в `public/fonts/`) для устранения зависимости от внешних CDN и npm-пакетов шрифтов. Это соответствует архитектурному решению из `03-architecture.md`.

**Ожидаемый результат:**
- DevTools Network не показывает запросов к `fonts.googleapis.com` или `fonts.gstatic.com`
- Все шрифты загружаются с того же домена, что и сайт
- Только формат `.woff2`
- Все `@font-face` содержат `font-display: swap`

### Step 6: Content Collection и миграция контента (Story 3.1, Story 3.2)

**`src/content/config.ts`** (Story 3.1):
```typescript
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
```

Файлы записей (Story 3.2) — создать в `src/content/notes/`:

1. `haki-dlya-optimizacii-v-1c-analitike.md` (или `.mdx`)
2. `lokalnye-llm-agenty-dlya-analiza-dokumentov.md` (или `.mdx`)
3. `patterny-pipelinov-v-airflow.md` (или `.mdx`)

Каждый файл содержит frontmatter в формате:

```yaml
---
title: "Хаки для оптимизации в 1С Аналитике"
date: 2024-05-15
category: "BI"
tags: ["1C-Analytics", "SQL", "Оптимизация"]
type: "Техническое"
description: "Практические приёмы оптимизации запросов и отчётов в 1С Аналитике."
---

<!-- Контент записи: мигрировать из db.notes в Сайт3.html -->
<!-- Если контент содержит сложную HTML-разметку — использовать .mdx -->
```

> **РЕШЕНИЕ О ФОРМАТЕ:** Записи из прототипа содержат сложную HTML-разметку с Tailwind-классами (grid, bujo-box, чек-листы). Рекомендуется использовать формат `.mdx` для этих записей, что позволяет вставлять HTML напрямую. Для будущих простых записей подойдет чистый `.md`.

**Ожидаемый результат:**
- `npm run build` завершается без ошибок Zod-валидации
- Сборка падает если убрать обязательное поле (например `title`) из frontmatter

### Step 7: Layout и компоненты (Stories 2.1, 2.2, 2.3)

Файлы для создания:

| Файл | Описание | Приоритет |
|------|----------|-----------|
| `src/layouts/BaseLayout.astro` | Корневой layout: html, head, sidebar + main | MUST |
| `src/components/Sidebar.astro` | Боковая панель: заголовок, навигация, облако тегов, подвал | MUST |
| `src/components/SEOHead.astro` | Мета-теги: title, description, OG, canonical, JSON-LD | MUST |
| `src/components/BujoBox.astro` | Контейнер с рамкой 2px solid black | MUST |
| `src/components/NoteCard.astro` | Карточка записи: дата + заголовок + теги | MUST |
| `src/components/TagBadge.astro` | Кликабельный бейдж тега | MUST |
| `src/components/BackButton.astro` | Кнопка "НАЗАД" | MUST |

Ключевые требования к компонентам:

- **BaseLayout:** Props — `title`, `description`, `ogImage`. Содержит `<Sidebar />` и `<slot />` в `<main>`. Подключает `global.css`. Использует `<html lang="ru">`.
- **Sidebar:** Заголовок "ИНДЕКС" — через `<div>` (НЕ `<h1>`), чтобы соблюсти единственный `<h1>` на странице (MAJ-1). Облако тегов генерируется из Content Collections через `getCollection('notes')`.
- **NoteCard:** Год отображается динамически через `note.data.date.getFullYear()` (MAJ-5). Вся карточка — ссылка `<a>`.
- **SEOHead:** Генерирует `<meta>`, `<link rel="canonical">`, JSON-LD (Schema.org WebSite / BlogPosting).

**Ожидаемый результат:**
- Двухколоночный layout при viewport >= 1024px: sidebar 288px слева, main справа
- Sidebar содержит: заголовок "ИНДЕКС", подзаголовок "ТЕХНИЧЕСКАЯ БАЗА ЗНАНИЙ", навигация ("Обзор", "Все записи"), облако тегов (9 тегов), подвал "ПУБЛИЧНЫЙ РЕСУРС"
- Hover-инверсия на интерактивных элементах (черный фон, белый текст)

### Step 8: Страницы (Stories 3.3, 3.4, 3.5, 3.6, 7.2)

| Файл | Маршрут | Описание |
|------|---------|----------|
| `src/pages/index.astro` | `/` | Главная страница "Обзор" — заголовок `<h1>ОБЗОР</h1>`, блок "Недавние записи" (до 10) |
| `src/pages/notes/index.astro` | `/notes/` | Все записи — заголовок `<h1>ВСЕ ЗАПИСИ</h1>`, карточки NoteCard |
| `src/pages/notes/[...slug].astro` | `/notes/[slug]/` | Детальная страница записи — BackButton, header (черный), prose-контент |
| `src/pages/tags/[tag].astro` | `/tags/[tag]/` | Фильтрация по тегу — заголовок `<h1>ТЕМА: #ТЕГ</h1>`, карточки NoteCard |
| `src/pages/404.astro` | `/404` | Страница ошибки — "404", кнопка "ВЕРНУТЬСЯ НА ГЛАВНУЮ" |
| `src/pages/rss.xml.ts` | `/rss.xml` | RSS-лента (RSS 2.0 XML) |

Ключевые требования к страницам:

- **`/notes/[...slug].astro`:** Использует `getStaticPaths()` для генерации маршрутов. Рендерит Markdown через `<Content />`.
- **`/tags/[tag].astro`:** Использует `getStaticPaths()` с `transliterate(tag)` для slug. Отображает оригинальное кириллическое написание тега в заголовке.
- **`/404.astro`:** Содержит `<meta name="robots" content="noindex">`.
- **`/rss.xml.ts`:** Использует `@astrojs/rss` и константы из `consts.ts`.

**Ожидаемый результат:**
- Все маршруты генерируются при `npm run build`
- В `dist/` создаются: `index.html`, `notes/index.html`, `notes/haki-dlya-optimizacii-v-1c-analitike/index.html`, `tags/optimizaciya/index.html` и т.д.
- 9 директорий в `dist/tags/` (по одной на каждый уникальный тег)

### Step 9: Адаптивная верстка и мобильный sidebar (Story 4.1, TECH-7)

Требования к мобильной адаптации (viewport < 768px):

1. **Sidebar:** Горизонтальная панель сверху. Используется `<details>/<summary>` для CSS-only раскрытия навигации (zero-JS предпочтителен). Видны только заголовок "ИНДЕКС" и индикатор раскрытия.
2. **NoteCard:** Вертикальный layout (`flex-direction: column`), блок даты сверху с `border-bottom` вместо `border-right`.
3. **Touch targets:** Все кликабельные элементы >= 44x44px.
4. **Код:** `overflow-x: auto` для блоков кода.

> **РЕШЕНИЕ:** Первичная реализация через `<details>/<summary>` (CSS-only). Если UX недостаточен — добавить inline `<script is:inline>` (10-20 строк) для toggle. Не использовать React/Vue.

**Ожидаемый результат:**
- На viewport 375px: sidebar свернут, показывает только заголовок и кнопку раскрытия
- Карточки NoteCard в вертикальном layout
- Минимальный font-size текста >= 14px

### Step 10: SEO, Sitemap, RSS (Stories 5.1, 5.2, 6.1, 6.2, 7.1)

Файлы:

- **`public/robots.txt`:**
  ```
  User-agent: *
  Allow: /

  Sitemap: https://<domain>/sitemap-index.xml
  ```

- **SEOHead компонент:** Генерирует на каждой странице:
  - `<title>`: формат `"Название | Tech Knowledge Base"`
  - `<meta name="description">`
  - `<meta property="og:title">`, `og:description`, `og:type`, `og:url`
  - `<meta property="og:locale" content="ru_RU">`
  - `<meta property="og:site_name" content="Tech Knowledge Base">`
  - `<link rel="canonical">`
  - JSON-LD: `WebSite` на главной, `BlogPosting` на детальных страницах

- **Shiki (TECH-6):** Настроена монохромная тема `github-light` в `astro.config.mjs`. Поддерживаемые языки: SQL, Python, JS/TS, YAML, Bash, JSON.

- **Prose (TECH-5):** `@tailwindcss/typography` настроен. Заголовки в контенте — Unbounded + uppercase. Ссылки — черные с подчеркиванием. `<hr>` — `border-b-2 border-black`.

**Проверка:**

```bash
cd /home/dmin/projects/avdeev.blog

# Сборка
npm run build

# Проверка sitemap
cat dist/sitemap-index.xml

# Проверка robots.txt
cat dist/robots.txt

# Проверка RSS
cat dist/rss.xml

# Проверка что 404 не в sitemap
grep "404" dist/sitemap-0.xml
# Ожидаемый результат: пустой вывод (404 отсутствует)
```

**Ожидаемый результат:**
- `dist/sitemap-index.xml` содержит все публичные страницы, исключая `/404` и `/rss.xml`
- `dist/robots.txt` содержит `Allow: /` и ссылку на sitemap
- `dist/rss.xml` содержит 3 элемента `<item>` с корректными данными
- На каждой странице присутствуют мета-теги SEO

### Step 11: Настройка CI/CD (Story 1.2)

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Требования безопасности CI/CD (CRIT-2):**
- `permissions: contents: read` — минимальные права
- Все Actions используют фиксированные версии (`@v4`, а не `@latest`)
- `npm ci` вместо `npm install` — reproducible builds
- Нет секретов в открытом виде
- `concurrency` предотвращает параллельные деплои

**Настройка GitHub Pages:**

```bash
# Включить GitHub Pages через GitHub CLI
gh api repos/<owner>/<repo>/pages -X POST -f source='{"branch":"main","path":"/"}' 2>/dev/null || true

# Альтернативно: через GitHub UI
# Settings → Pages → Source: GitHub Actions
```

> **ВАЖНО:** В настройках репозитория на GitHub: Settings -> Pages -> Build and deployment -> Source -> выбрать "GitHub Actions".

**Ожидаемый результат:**
- Push в `main` автоматически запускает GitHub Actions workflow
- Workflow завершается за < 120 секунд
- Сайт доступен по `https://<username>.github.io/<repo>/`

### Step 12: Настройка Dependabot

**`.github/dependabot.yml`:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

**Ожидаемый результат:**
- Dependabot автоматически создает PR при обнаружении уязвимостей в npm-зависимостях
- Dependabot отслеживает обновления GitHub Actions

### Step 13: Финальная сборка и локальная верификация

```bash
cd /home/dmin/projects/avdeev.blog

# Чистая сборка
rm -rf dist .astro
npm ci
npm run build

# Предварительный просмотр (имитация production)
npm run preview
# Сайт доступен на http://localhost:4321/<base>/

# Проверка структуры dist/
ls -la dist/
ls -la dist/notes/
ls -la dist/tags/

# Проверка количества директорий тегов (ожидается 9)
ls dist/tags/ | wc -l

# Проверка наличия ключевых файлов
test -f dist/index.html && echo "OK: index.html" || echo "FAIL: index.html"
test -f dist/404.html && echo "OK: 404.html" || echo "FAIL: 404.html"
test -f dist/rss.xml && echo "OK: rss.xml" || echo "FAIL: rss.xml"
test -f dist/sitemap-index.xml && echo "OK: sitemap-index.xml" || echo "FAIL: sitemap-index.xml"
test -f dist/robots.txt && echo "OK: robots.txt" || echo "FAIL: robots.txt"
test -f dist/notes/index.html && echo "OK: notes/index.html" || echo "FAIL: notes/index.html"
test -f dist/notes/haki-dlya-optimizacii-v-1c-analitike/index.html && echo "OK: note detail" || echo "FAIL: note detail"
```

**Ожидаемый результат:**
- `npm run build` завершается без ошибок за < 60 секунд
- Все проверки файлов выводят "OK"
- `dist/tags/` содержит 9 директорий
- `npm run preview` показывает корректный сайт

### Step 14: Тест на XSS через MDX (CRIT-3)

```bash
cd /home/dmin/projects/avdeev.blog

# Создать тестовый MDX-файл с XSS-вектором
cat > src/content/notes/test-xss.mdx << 'EOF'
---
title: "XSS Test"
date: 2024-01-01
category: "Test"
tags: ["Test"]
type: "Техническое"
---

Текст записи.

<script>alert('xss')</script>

Продолжение текста.
EOF

# Собрать
npm run build

# Проверить что <script> экранирован в HTML
grep -c "<script>alert" dist/notes/test-xss/index.html
# Ожидаемый результат: 0 (скрипт экранирован или удален)

# Удалить тестовый файл
rm src/content/notes/test-xss.mdx
```

> **ВАЖНО:** Если `<script>` НЕ экранируется в MDX — необходимо добавить плагин `rehype-sanitize` в конфигурацию Astro. Это блокирует релиз (CRIT-3).

**Ожидаемый результат:**
- `<script>alert('xss')</script>` либо удален, либо экранирован в отрендеренном HTML
- XSS через MDX-контент невозможен

### Step 15: Деплой на GitHub Pages

```bash
cd /home/dmin/projects/avdeev.blog

# Убедиться что все изменения закоммичены
git status

# Push в main — автоматически запускает деплой
git push origin main

# Проверка статуса workflow
gh run list --limit 1
gh run watch

# После завершения — проверить URL
curl -I https://<username>.github.io/<repo>/
# Ожидаемый результат: HTTP/2 200
```

**Ожидаемый результат:**
- GitHub Actions workflow завершается со статусом `success`
- Сайт доступен по HTTPS
- `curl -I` возвращает HTTP 200 для корневого URL

---

## Code Implementation Tasks

| # | Task | Описание | Target File | Story/TECH | Приоритет | Фаза |
|---|------|----------|-------------|------------|-----------|------|
| 1 | Инициализация Astro | Создать проект Astro с TypeScript strict, установить зависимости | `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs` | Story 1.1 | MUST | 1 |
| 2 | Git-репозиторий | Инициализировать Git, создать `.gitignore`, первый коммит, создать GitHub repo | `.gitignore` | Story 1.3 | MUST | 1 |
| 3 | Self-hosted шрифты | Скачать woff2-файлы Geist, Geist Mono, Unbounded, написать `@font-face` | `public/fonts/*.woff2`, `src/styles/global.css` | TECH-2 | MUST | 1 |
| 4 | Константы сайта | Создать файл констант: SITE_NAME, SITE_DESCRIPTION, SITE_URL, AUTHOR_NAME | `src/consts.ts` | TECH-3 | MUST | 1 |
| 5 | Глобальные CSS стили | Перенести CSS из `Сайт3.html`: точечная сетка, bujo-box, скроллбар, selection | `src/styles/global.css` | TECH-4 | MUST | 1 |
| 6 | Content Collection схема | Zod-схема frontmatter для записей | `src/content/config.ts` | Story 3.1 | MUST | 1 |
| 7 | Утилита транслитерации | Функция кириллица -> латиница для slug тегов | `src/utils/transliterate.ts` | TECH-1 | MUST | 1 |
| 8 | Утилита дат | Функция форматирования дат (DD.MM, DD.MM.YYYY) | `src/utils/date.ts` | (утилита) | MUST | 1 |
| 9 | Глобальные стили в Astro | Верификация и доводка CSS из TECH-4 в контексте Astro-компонентов | `src/styles/global.css` | Story 2.1 | MUST | 2 |
| 10 | BaseLayout | Корневой layout: html, head, body, sidebar + main, подключение стилей и шрифтов | `src/layouts/BaseLayout.astro` | Story 2.2 | MUST | 2 |
| 11 | Sidebar | Боковая панель: заголовок "ИНДЕКС" (через `<div>`, НЕ `<h1>`), навигация, облако тегов, подвал | `src/components/Sidebar.astro` | Story 2.2 | MUST | 2 |
| 12 | SEOHead | Мета-теги: title, description, OG, canonical, JSON-LD Schema.org | `src/components/SEOHead.astro` | Story 5.1 | SHOULD | 2 |
| 13 | BujoBox | Контейнер с рамкой, props: title, headerVariant, class | `src/components/BujoBox.astro` | Story 2.3 | MUST | 2 |
| 14 | NoteCard | Карточка записи: блок даты (динамический год!) + заголовок + теги. Вся карточка — ссылка | `src/components/NoteCard.astro` | Story 2.3 | MUST | 2 |
| 15 | TagBadge | Бейдж тега — ссылка на `/tags/[tagSlug]/` | `src/components/TagBadge.astro` | Story 2.3 | MUST | 2 |
| 16 | BackButton | Кнопка "НАЗАД" — ссылка на `/` | `src/components/BackButton.astro` | Story 2.3 | MUST | 2 |
| 17 | Миграция записи 1 | Перенести "Хаки для оптимизации в 1С Аналитике" из прототипа в MDX | `src/content/notes/haki-dlya-optimizacii-v-1c-analitike.mdx` | Story 3.2 | MUST | 3 |
| 18 | Миграция записи 2 | Перенести "Локальные LLM-агенты для анализа документов" из прототипа в MDX | `src/content/notes/lokalnye-llm-agenty-dlya-analiza-dokumentov.mdx` | Story 3.2 | MUST | 3 |
| 19 | Миграция записи 3 | Перенести "Паттерны пайплайнов в Airflow" из прототипа в MDX | `src/content/notes/patterny-pipelinov-v-airflow.mdx` | Story 3.2 | MUST | 3 |
| 20 | Главная страница | Заголовок "ОБЗОР", блок "Недавние записи" (до 10, сортировка по дате) | `src/pages/index.astro` | Story 3.3 | MUST | 3 |
| 21 | Страница всех записей | Заголовок "ВСЕ ЗАПИСИ", список NoteCard | `src/pages/notes/index.astro` | Story 3.4 | MUST | 3 |
| 22 | Фильтрация по тегу | getStaticPaths + transliterate, заголовок "ТЕМА: #ТЕГ", список NoteCard | `src/pages/tags/[tag].astro` | Story 3.5 | MUST | 3 |
| 23 | Детальная страница записи | getStaticPaths, BackButton, header (черный), `<Content />`, prose-стилизация | `src/pages/notes/[...slug].astro` | Story 3.6 | MUST | 3 |
| 24 | Tailwind typography | Настройка prose: шрифты, ссылки, hr, blockquote, маркеры | `tailwind.config.mjs` | TECH-5 | SHOULD | 4 |
| 25 | Shiki тема | Монохромная тема подсветки кода, стилизация блоков | `astro.config.mjs` | TECH-6 | SHOULD | 4 |
| 26 | Подсветка синтаксиса | Тонкая настройка: заголовок блока кода, padding, overflow | `src/styles/global.css` | Story 6.1 | SHOULD | 4 |
| 27 | Prose-типографика | Тонкая настройка: заголовки Unbounded, ссылки, hr | `tailwind.config.mjs`, `src/styles/global.css` | Story 6.2 | SHOULD | 4 |
| 28 | Адаптивная верстка | Медиа-запросы для viewport < 768px: NoteCard вертикальный, touch targets | Все компоненты | Story 4.1 | MUST | 4 |
| 29 | Мобильный sidebar | `<details>/<summary>` или inline JS для сворачиваемой навигации | `src/components/Sidebar.astro` | TECH-7 | MUST | 4 |
| 30 | SEO мета-теги | Все страницы: title, description, OG, canonical, JSON-LD | `src/components/SEOHead.astro`, все страницы | Story 5.1 | SHOULD | 5 |
| 31 | Sitemap + robots.txt | `@astrojs/sitemap` + статический `public/robots.txt` | `astro.config.mjs`, `public/robots.txt` | Story 5.2 | SHOULD | 5 |
| 32 | RSS-лента | `@astrojs/rss`, 3 записи, формат RSS 2.0 | `src/pages/rss.xml.ts` | Story 7.1 | SHOULD | 5 |
| 33 | Страница 404 | Заголовок "404", "СТРАНИЦА НЕ НАЙДЕНА", кнопка возврата, `noindex` | `src/pages/404.astro` | Story 7.2 | SHOULD | 5 |
| 34 | CI/CD pipeline | GitHub Actions workflow: checkout, npm ci, build, deploy | `.github/workflows/deploy.yml` | Story 1.2 | MUST | 5 |
| 35 | Dependabot | Автоматическое обнаружение уязвимостей | `.github/dependabot.yml` | (безопасность) | SHOULD | 5 |

**Итого: 35 задач. 23 MUST, 12 SHOULD.**

---

## Smoke Test Procedure

### Локальная проверка (перед деплоем)

| # | Тест | Шаги | Ожидаемый результат | Pass/Fail |
|---|------|------|---------------------|-----------|
| S-1 | Сборка без ошибок | `npm run build` | Команда завершается с exit code 0, без ошибок в консоли | |
| S-2 | Структура dist/ | `ls dist/` | Присутствуют: `index.html`, `404.html`, `rss.xml`, `sitemap-index.xml`, `robots.txt`, `notes/`, `tags/`, `fonts/` | |
| S-3 | Количество тегов | `ls dist/tags/ \| wc -l` | Вывод: `9` | |
| S-4 | Количество записей | `ls dist/notes/ \| grep -v index.html \| wc -l` | Вывод: `3` (директории slug записей) | |
| S-5 | Dev-сервер запускается | `npm run dev` | Сервер стартует на `localhost:4321` без ошибок | |
| S-6 | Главная страница | Открыть `/` в браузере | Заголовок "ОБЗОР", блок "Недавние записи" с 3 записями, sidebar видим | |
| S-7 | Страница всех записей | Открыть `/notes/` | 3 карточки NoteCard, сортировка по дате (15.05, 10.05, 20.04) | |
| S-8 | Детальная страница | Открыть `/notes/haki-dlya-optimizacii-v-1c-analitike/` | Кнопка "НАЗАД", черный header с заголовком, контент записи | |
| S-9 | Фильтрация по тегу | Открыть `/tags/sql/` | Заголовок "ТЕМА: #SQL", отфильтрованные карточки | |
| S-10 | Страница 404 | Открыть `/not-existing-page/` | Заголовок "404", кнопка "ВЕРНУТЬСЯ НА ГЛАВНУЮ" | |
| S-11 | RSS-лента | Открыть `/rss.xml` | Валидный XML с 3 элементами `<item>` | |
| S-12 | Мобильная верстка | Chrome DevTools: viewport 375px | Sidebar свернут, карточки вертикальные, touch targets >= 44px | |
| S-13 | Hover-инверсия | Навести на NoteCard | Фон черный, текст белый, заголовок подчеркнут | |
| S-14 | Облако тегов в sidebar | Проверить блок "Темы" | 9 уникальных тегов с префиксом `#`, каждый — кликабельная ссылка | |
| S-15 | Шрифты self-hosted | DevTools Network: фильтр по Font | Нет запросов к `fonts.googleapis.com` или `fonts.gstatic.com` | |
| S-16 | Точечная сетка | Инспектировать body | `background-image: radial-gradient(#d1d5db 1.5px, transparent 1.5px)` | |
| S-17 | Инверсия selection | Выделить текст мышью | Черный фон, белый текст при выделении | |
| S-18 | Подсветка кода | Открыть запись с блоком кода | Блок `<pre><code>` со span-элементами подсветки Shiki | |
| S-19 | Навигация sidebar | Кликнуть "Все записи" в sidebar | Переход на `/notes/`, HTTP 200 | |
| S-20 | Кнопка НАЗАД | На детальной странице нажать "НАЗАД" | Переход на `/` | |

### Production-проверка (после деплоя)

| # | Тест | Шаги | Ожидаемый результат | Pass/Fail |
|---|------|------|---------------------|-----------|
| P-1 | Доступность сайта | `curl -I https://<domain>/` | HTTP/2 200, `content-type: text/html` | |
| P-2 | HTTPS | Открыть сайт в браузере | Замок в адресной строке, нет предупреждений | |
| P-3 | Все маршруты | Проверить каждый URL из списка | HTTP 200 для всех маршрутов | |
| P-4 | RSS доступен | `curl https://<domain>/rss.xml` | Валидный RSS 2.0 XML | |
| P-5 | Sitemap доступен | `curl https://<domain>/sitemap-index.xml` | Валидный XML с URL страниц | |
| P-6 | Lighthouse Desktop | PageSpeed Insights: Desktop | Performance >= 90, Accessibility >= 95, SEO >= 95 | |
| P-7 | Lighthouse Mobile | PageSpeed Insights: Mobile | Performance >= 90, Accessibility >= 95, SEO >= 95 | |
| P-8 | Реальное мобильное устройство | Открыть сайт на телефоне | Корректное отображение, sidebar работает | |
| P-9 | Нет внешних запросов к CDN | DevTools Network | Нет запросов к Google Fonts, CDN Tailwind, unpkg | |
| P-10 | Zero JS | DevTools: `document.querySelectorAll('script')` | Максимум 1 inline-скрипт (мобильный sidebar), нет внешних скриптов | |

---

## Rollback Procedure

### Trigger: Когда откатывать

Релиз откатывается если после деплоя обнаружено ЛЮБОЕ из следующих условий:

1. **Сайт недоступен по HTTPS** — HTTP 5xx на корневом URL более 5 минут
2. **Критические визуальные поломки** — отсутствие стилей, нечитаемый текст, пустые страницы
3. **XSS-уязвимость** — выполняемый JavaScript в отрендеренном контенте записей
4. **Утечка чувствительных данных** — токены, ключи, приватные данные в исходном коде или сборке
5. **Некорректные URL** — основные маршруты (`/`, `/notes/`, `/notes/[slug]/`) возвращают 404

### Способ 1: Revert последнего коммита (рекомендуется)

```bash
cd /home/dmin/projects/avdeev.blog

# Посмотреть последние коммиты
git log --oneline -5

# Создать revert-коммит (НЕ удаляет историю)
git revert HEAD --no-edit

# Push — автоматически запустит новый деплой
git push origin main

# Дождаться завершения workflow
gh run watch
```

**Ожидаемый результат:** GitHub Actions собирает предыдущую версию и деплоит.

### Способ 2: Отключение GitHub Pages (экстренный)

```bash
# Через GitHub CLI
gh api repos/<owner>/<repo>/pages -X DELETE

# Или через GitHub UI:
# Settings → Pages → удалить источник деплоя
```

**Ожидаемый результат:** Сайт становится недоступен. Используется только в экстренных случаях (утечка данных, XSS).

### Способ 3: Откат к конкретному коммиту

```bash
cd /home/dmin/projects/avdeev.blog

# Найти рабочий коммит
git log --oneline -20

# Создать ветку от рабочего коммита
git checkout -b hotfix/<описание> <commit-hash>

# Внести исправление (если необходимо)
# ...

# Merge в main
git checkout main
git merge hotfix/<описание>
git push origin main
```

### Время восстановления

- **Revert коммита:** ~2-3 минуты (время GitHub Actions workflow)
- **Отключение Pages:** ~30 секунд (сайт недоступен немедленно)
- **Hotfix:** 10-30 минут (зависит от сложности исправления)

---

## Post-Release Verification

### Немедленно после деплоя (День 0)

- [ ] Сайт доступен по HTTPS (`curl -I https://<domain>/` возвращает 200)
- [ ] Все 5 основных маршрутов отдают HTTP 200: `/`, `/notes/`, `/notes/[slug]/`, `/tags/[tag]/`, `/404`
- [ ] RSS-лента `/rss.xml` доступна и содержит 3 записи
- [ ] Sitemap `/sitemap-index.xml` доступен
- [ ] Lighthouse аудит: Performance >= 90, Accessibility >= 95, SEO >= 95
- [ ] Проверка на реальном мобильном устройстве (320px - 768px)
- [ ] Все шрифты загружаются с собственного домена (нет запросов к внешним CDN)
- [ ] DevTools Console: нет ошибок JavaScript
- [ ] Нет Mixed Content предупреждений

### В течение 1 дня после запуска

- [ ] Добавить сайт в Google Search Console, отправить sitemap
- [ ] Добавить сайт в Яндекс.Вебмастер, отправить sitemap
- [ ] Поделиться ссылкой с 2-3 коллегами-разработчиками для обратной связи
- [ ] Запустить `npm audit` и устранить найденные уязвимости (если есть)

### Через 1 неделю

- [ ] Проверить статус индексации в Google Search Console
- [ ] Проверить статус индексации в Яндекс.Вебмастер
- [ ] Повторить Lighthouse аудит — подтвердить стабильность метрик
- [ ] Собрать и проанализировать обратную связь от коллег

### Через 2 недели

- [ ] Опубликовать 4-ю запись через стандартный workflow (создать .md файл, git push)
- [ ] Верифицировать процесс добавления нового контента
- [ ] Проверить что RSS, sitemap, облако тегов обновились
- [ ] Планирование v1.1 на основании обратной связи

---

## Release Notes

### v1.0 — Первый публичный релиз

**Новое:**
- Публичная техническая база знаний в стиле "Строгий Цифровой Сад"
- Монохромный дизайн с точечной сеткой, вдохновлённый инженерными журналами и Bullet Journal
- 3 технические записи: оптимизация 1С Аналитики, LLM-агенты для анализа документов, паттерны пайплайнов в Airflow
- Навигация: главная страница с обзором, полный каталог записей, фильтрация по тегам (9 тегов)
- Подсветка синтаксиса для SQL, Python, JavaScript, YAML, Bash, JSON
- Адаптивная верстка для мобильных устройств (от 320px)
- SEO: мета-теги, Open Graph, Schema.org (WebSite, BlogPosting), sitemap, robots.txt
- RSS-лента для подписки
- Кастомная страница 404
- Автоматический деплой через GitHub Actions при push в main
- Self-hosted шрифты: Geist, Geist Mono, Unbounded (без зависимости от Google Fonts)

**Известные ограничения:**
- Кнопка "НАЗАД" на детальной странице всегда ведёт на главную (`/`), а не на предыдущую страницу. Запланировано на v1.1.
- Нет пагинации на странице "Все записи". При текущем объёме (3 записи) не требуется. Запланировано на v2.0 при достижении 30+ записей.
- Правая колонка главной страницы упрощена (блоки "Статистика" и "Бэклог" из прототипа отложены до v2.0).
- Аналитика не подключена (Plausible/Umami и Яндекс Метрика запланированы на v1.1).
- Нет cookie-баннера (не требуется до подключения Яндекс Метрики в v1.1).
- Twitter Card мета-теги не реализованы (минимальное влияние на трафик).
- Полнотекстовый поиск не реализован (при 3-20 записях навигация через теги достаточна). Запланировано на v2.0.

---

## Принятые решения (зафиксированные в процессе подготовки релиза)

| # | Решение | Обоснование |
|---|---------|-------------|
| 1 | **9 тегов** (не 8) — 1C-Analytics, SQL, Оптимизация, AI-Агенты, LLM, Python, Пайплайны-данных, ETL, Airflow | Фактический подсчёт из прототипа. Противоречие CRIT-1 устранено. |
| 2 | **"Индекс" в sidebar — `<div>`, не `<h1>`** | MAJ-1: единственный `<h1>` на странице зарезервирован для основного контента ("ОБЗОР", "ВСЕ ЗАПИСИ" и т.д.). |
| 3 | **Год в NoteCard — динамический** | MAJ-5: используется `note.data.date.getFullYear()` вместо хардкода "2024". |
| 4 | **Кнопка "НАЗАД" ведёт на `/`** | Осознанное UX-решение для v1. Зафиксировано как Known Limitation. |
| 5 | **MDX для записей с кастомной разметкой** | Контент прототипа содержит Tailwind-классы и grid-структуры. MDX позволяет HTML-fallback. |
| 6 | **Self-hosted woff2 (вариант B)** | Устранение зависимости от внешних CDN. Файлы в `public/fonts/`. |
| 7 | **`<details>/<summary>` для мобильного sidebar** | Zero-JS решение с нативной accessibility. Inline JS добавляется только если UX недостаточен. |
| 8 | **Tailwind CSS 3.x** (не 4.x) | Прототип использует Tailwind 3.x классы. Миграция на 4.x отложена. |
| 9 | **Dependabot включён** | Автоматическое обнаружение уязвимостей в npm-зависимостях и GitHub Actions. |

---

## Quality Checklist (самопроверка документа)

- [x] Каждый шаг Release Procedure содержит точные команды или описание действий
- [x] Smoke-тесты покрывают все критические пользовательские пути: главная, список записей, детальная страница, фильтрация по тегу, 404, RSS, мобильная версия
- [x] Rollback procedure документирован с тремя сценариями (revert, отключение Pages, hotfix) и оценкой времени восстановления
- [x] Post-release verification содержит конкретные, измеримые проверки с таймлайном
- [x] Release notes написаны для конечного пользователя (без технического жаргона)
- [x] Code Implementation Tasks ссылаются на конкретные файлы из архитектуры (`03-architecture.md`)
- [x] Все решения по CRIT и MAJ проблемам из QA-отчета зафиксированы
- [x] Pre-release checklist включает все обязательные критерии из `08-release-plan.md`
- [x] CI/CD workflow содержит требования безопасности (permissions, фиксированные версии, npm ci)
- [x] XSS тест-процедура документирована (Step 14)
