# Specifications: Tech Knowledge Base (Строгий Цифровой Сад)

## Допущения

1. **Статический сайт без серверной части.** Astro SSG на GitHub Pages. Нет сервера, базы данных, аутентификации, форм ввода, пользовательских аккаунтов. Все спецификации адаптированы под эту реальность.
2. **Аналитика -- lightweight и privacy-friendly + Яндекс Метрика.** Вместо Google Analytics рекомендуется Plausible или Umami (self-hosted или cloud). Обе системы не используют cookies, не требуют баннера согласия, совместимы с GDPR. Дополнительно подключается Яндекс Метрика -- для глубокой аналитики поведения (Вебвизор, карты кликов/скроллов), а также для интеграции с Яндекс.Вебмастером и улучшения индексации в Яндексе. GA-план ниже написан в терминах событий, применимых к любой из этих систем; маппинг на цели Яндекс Метрики описан в отдельном подразделе.
3. **Аналитика -- не в scope v1.** Интеграция аналитики отложена (см. 01-product-analysis.md: "Аналитика посещений: можно добавить позже, не блокирует запуск"). Данный план описывает целевую конфигурацию для подключения в v1.1 или v2.
4. **Безопасность ограничена поверхностью атаки статического сайта.** Нет пользовательского ввода, нет API, нет хранения данных пользователей. Раздел ИБ сфокусирован на реальных векторах: supply chain, CI/CD, зависимости, конфигурация хостинга.
5. **SEO критичен для проекта.** Основной канал привлечения читателей -- поисковые системы (Google, Yandex). SEO-требования имеют приоритет SHOULD и должны быть реализованы к моменту публичного запуска.
6. **Контент на русском языке.** Кириллические URL транслитерируются. `<html lang="ru">`.

---

## GA Markup Plan

> **Примечание:** Вместо Google Analytics рекомендуется Plausible Analytics или Umami -- privacy-friendly альтернативы без cookies, с минимальным влиянием на производительность (скрипт ~1 KB vs ~45 KB у GA). Дополнительно подключается Яндекс Метрика для поведенческого анализа (Вебвизор, карты кликов/скроллов) и интеграции с Яндекс.Вебмастером. План событий ниже применим к любой из этих систем. Названия событий унифицированы; маппинг на цели Яндекс Метрики -- в подразделе "Яндекс Метрика".

### Events to Track

| Event Name | Trigger | Parameters | Purpose |
|------------|---------|------------|---------|
| `pageview` | Загрузка любой страницы | `path`, `title`, `referrer` | Базовая метрика посещаемости; определение популярных страниц и источников трафика |
| `note_view` | Открытие детальной страницы записи (`/notes/[slug]/`) | `slug`, `title`, `category`, `tags` | Определение самых читаемых записей; понимание, какие темы привлекают аудиторию |
| `tag_filter` | Переход на страницу фильтрации по тегу (`/tags/[tag]/`) | `tag`, `tag_slug` | Понимание, какие темы интересуют аудиторию; приоритизация создания нового контента |
| `outbound_link` | Клик по внешней ссылке в контенте записи | `url`, `link_text`, `source_page` | Понимание, какие ресурсы ценны для аудитории |
| `rss_subscribe` | Клик по ссылке RSS в sidebar | `source_page` | Оценка спроса на RSS-подписку |
| `404_hit` | Загрузка страницы 404 | `path`, `referrer` | Обнаружение битых ссылок; понимание, какие URL пользователи ожидают найти |
| `scroll_depth` | Прокрутка контента записи до 25%, 50%, 75%, 100% | `slug`, `depth_percent` | Оценка вовлечённости: дочитывают ли записи до конца |
| `back_button` | Клик по кнопке "НАЗАД" на детальной странице | `source_slug` | Понимание навигационных паттернов (кнопка vs sidebar) |
| `sidebar_nav` | Клик по пункту навигации в sidebar ("Обзор", "Все записи") | `nav_item`, `source_page` | Понимание паттернов навигации |
| `code_copy` | Копирование текста из блока кода (v2, при добавлении кнопки "Copy") | `slug`, `language`, `block_index` | Оценка практической ценности кода в записях |

### Conversion Funnels

1. **Читатель из поиска:** `organic_landing` (pageview с referrer = google/yandex) -> `note_view` (чтение записи) -> `scroll_depth >= 75%` (вовлечённое чтение) -> `tag_filter` или `sidebar_nav` (переход к другому контенту)

2. **Возвращение через RSS:** `rss_subscribe` (клик на RSS) -> [внешнее: добавление в ридер] -> `pageview` с referrer = RSS-ридер -> `note_view`

3. **Исследование сайта:** `pageview` (главная `/`) -> `note_view` (клик на запись из "Недавние записи") -> `tag_filter` (клик на тег) -> `note_view` (чтение связанной записи)

### Custom Dimensions/Metrics

| Name | Scope | Description |
|------|-------|-------------|
| `note_category` | Event | Категория записи (BI, AI, Инженерия) -- для сегментации отчётов по тематике |
| `note_type` | Event | Тип записи (Техническое, Эксперимент, Лучшая практика) -- для понимания, какой формат контента более востребован |
| `content_tags` | Event | Массив тегов записи -- для анализа популярности конкретных технологий |
| `device_type` | Session | Desktop / Tablet / Mobile -- для приоритизации адаптивных задач |
| `reading_time_estimate` | Event | Расчётное время чтения записи (на основе длины контента, ~200 слов/мин) -- для корреляции с scroll_depth |

### Реализация

**Plausible Analytics (рекомендуемый вариант):**
- Подключение: один `<script>` тег в `BaseLayout.astro` (`<script defer data-domain="avdeev.blog" src="https://plausible.io/js/script.js"></script>`)
- Pageview трекается автоматически
- Custom events через `plausible('event_name', {props: {...}})`
- Self-hosted вариант: бесплатен, требует VPS (~$5/мес) или Docker

**Umami (альтернатива):**
- Подключение: один `<script>` тег
- Self-hosted на Vercel/Railway (бесплатный тир)
- Custom events через `umami.track('event_name', {...})`

**Размер скрипта:** Plausible ~1 KB, Umami ~2 KB (vs Google Analytics ~45 KB). Влияние на Core Web Vitals минимально.

### Яндекс Метрика

> **Зачем:** Яндекс Метрика добавляется параллельно с Plausible/Umami для решения задач, которые privacy-friendly аналитика не покрывает: визуальный анализ поведения (Вебвизор, карты кликов/скроллов), интеграция с Яндекс.Вебмастером и подтверждение владения сайтом для Яндекса. Это критично для проекта, где Яндекс -- один из двух основных каналов привлечения трафика.

#### Установка счётчика

**Код счётчика** размещается в `BaseLayout.astro` перед закрывающим тегом `</head>`:

```html
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(XXXXXXXX, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/XXXXXXXX" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
```

- `XXXXXXXX` -- заменить на реальный номер счётчика после создания в интерфейсе Яндекс Метрики
- `noscript`-фолбек обеспечивает учёт посетителей с отключённым JavaScript
- Параметры инициализации: `clickmap` (карта кликов), `trackLinks` (отслеживание внешних ссылок), `accurateTrackBounce` (точный показатель отказов с таймаутом 15 секунд), `webvisor` (запись сессий)

**Рекомендация по размещению:** Скрипт Яндекс Метрики (~35 KB) тяжелее Plausible/Umami. Для минимизации влияния на Core Web Vitals рекомендуется загружать его асинхронно (уже обеспечено флагом `async` в коде счётчика) и рассмотреть отложенную загрузку через `requestIdleCallback` или событие `load`:

```javascript
window.addEventListener('load', function() {
  // Инициализация Яндекс Метрики после полной загрузки страницы
  // (переместить код ym() сюда)
});
```

#### Цели (Яндекс Метрика Goals)

Маппинг событий из основного GA-плана на цели Яндекс Метрики:

| Событие (GA-план) | Тип цели в Метрике | Идентификатор цели | Условие | Примечание |
|--------------------|--------------------|--------------------|---------|------------|
| `note_view` | JavaScript-событие | `note-view` | `ym(XXXXXXXX, 'reachGoal', 'note-view', {slug: '...', category: '...'})` | Основная конверсия: пользователь открыл запись |
| `tag_filter` | JavaScript-событие | `tag-filter` | `ym(XXXXXXXX, 'reachGoal', 'tag-filter', {tag: '...'})` | Интерес к теме |
| `outbound_link` | JavaScript-событие | `outbound-link` | `ym(XXXXXXXX, 'reachGoal', 'outbound-link', {url: '...'})` | Переход по внешней ссылке. Также покрывается автоматическим `trackLinks` |
| `rss_subscribe` | JavaScript-событие | `rss-subscribe` | `ym(XXXXXXXX, 'reachGoal', 'rss-subscribe')` | Клик по RSS-ссылке |
| `404_hit` | JavaScript-событие | `404-hit` | `ym(XXXXXXXX, 'reachGoal', '404-hit', {path: '...'})` | Посещение страницы 404 |
| `scroll_depth` | JavaScript-событие | `scroll-25` / `scroll-50` / `scroll-75` / `scroll-100` | `ym(XXXXXXXX, 'reachGoal', 'scroll-75', {slug: '...'})` | Отдельная цель на каждый порог; `scroll-75` и `scroll-100` -- ключевые |
| `back_button` | JavaScript-событие | `back-button` | `ym(XXXXXXXX, 'reachGoal', 'back-button')` | Навигация назад |
| `sidebar_nav` | JavaScript-событие | `sidebar-nav` | `ym(XXXXXXXX, 'reachGoal', 'sidebar-nav', {nav_item: '...'})` | Использование sidebar-навигации |
| `code_copy` | JavaScript-событие | `code-copy` | `ym(XXXXXXXX, 'reachGoal', 'code-copy', {slug: '...', language: '...'})` | v2: копирование кода |

**Параметры визитов и посетителей:**
- Передавать `note_category`, `note_type`, `content_tags` через `ym(XXXXXXXX, 'params', {...})` для сегментации в отчётах Метрики

#### Вебвизор (Session Replay)

**Конфигурация:**
- Включён через параметр `webvisor: true` при инициализации счётчика
- Вебвизор 2.0 (по умолчанию в новых счётчиках) -- записывает DOM-изменения, не скриншоты
- Запись доступна для анализа в течение 15 дней (ограничение Яндекса)

**Рекомендации по использованию:**
- Анализировать сессии с высоким показателем отказов -- понять, почему пользователи уходят
- Сопоставлять scroll_depth < 25% с записями Вебвизора -- выявлять проблемы с контентом или вёрсткой
- Проверять пользовательский опыт на мобильных устройствах -- особенно навигацию через sidebar
- Для страницы 404: анализировать, что пользователь делал до и после попадания на ошибку

**Конфиденциальность:**
- Вебвизор не записывает ввод в текстовые поля (в v1 нет форм -- не актуально)
- Яндекс Метрика использует cookies (в отличие от Plausible/Umami) -- см. раздел Compliance

#### Карта кликов / Карта скроллов

**Карта кликов (Clickmap):**
- Включена через параметр `clickmap: true` при инициализации
- Визуализирует все клики на странице в виде тепловой карты
- Применение для проекта:
  - Sidebar: какие пункты навигации и теги кликаются чаще всего
  - Главная страница: какие записи из "Недавние записи" привлекают внимание
  - Детальная страница: кликают ли по тегам, кнопке "НАЗАД", внешним ссылкам в тексте
  - Выявление "мёртвых зон" -- элементов, которые выглядят кликабельными, но не являются ссылками

**Карта скроллов (Scroll Map):**
- Включается автоматически при активном Вебвизоре
- Показывает, до какого места страницы прокручивают пользователи (тепловая карта по глубине)
- Применение для проекта:
  - Детальные страницы записей: подтверждение/дополнение данных `scroll_depth` из GA-плана
  - Главная страница: видят ли пользователи все записи в блоке "Недавние записи"
  - Страница "Все записи": на какой записи пользователи прекращают скроллить

**Карта форм:**
- Не актуальна для v1 (нет форм на сайте)

#### Интеграция с Яндекс.Вебмастером

**Подтверждение владения сайтом:**

Добавить мета-тег в `<head>` через `BaseLayout.astro` или `SEOHead.astro`:

```html
<meta name="yandex-verification" content="XXXXXXXXXXXXXXXX" />
```

- Значение `content` получить в панели Яндекс.Вебмастера после добавления сайта
- Альтернативные методы подтверждения (DNS-запись, HTML-файл) -- менее предпочтительны для данного стека, так как мета-тег версионируется в Git

**Отправка Sitemap:**
- В панели Яндекс.Вебмастера: "Индексирование" -> "Файлы Sitemap" -> добавить URL `https://<domain>/sitemap-index.xml`
- Sitemap уже генерируется через `@astrojs/sitemap` (см. SEO Requirements)
- Яндекс.Вебмастер будет переиндексировать sitemap периодически

**Настройки в Яндекс.Вебмастере:**
- "Индексирование" -> "Переобход страниц": запросить индексацию новых записей после публикации
- "Индексирование" -> "Региональность": установить регион, если целевая аудитория локализована (опционально)
- "Поисковые запросы" -> "Популярные запросы": мониторинг позиций по целевым ключевым словам
- "Диагностика" -> "Безопасность и нарушения": мониторинг проблем с безопасностью
- Robots.txt уже содержит `Sitemap:` директиву (см. SEO Requirements)

#### Контентная аналитика

**Отчёт "Содержание" (Content Analytics):**
- Доступен при включённом Вебвизоре
- Показывает, какие блоки контента на странице были просмотрены, а какие проигнорированы
- Применение для проекта:
  - Анализировать, какие разделы длинных записей читаются, а какие пропускаются
  - Оценивать эффективность структуры записи (заголовки, чек-листы, блоки кода)
  - Сопоставлять с данными `scroll_depth` для более точной картины вовлечённости

**Параметры содержания (Content Parameters):**
- Передавать метаданные записи через JavaScript-параметры для сегментации в контентных отчётах:

```javascript
// На детальной странице записи
ym(XXXXXXXX, 'params', {
  content: {
    category: 'BI',           // из frontmatter
    type: 'Техническое',      // из frontmatter
    tags: ['Оптимизация', '1C-Analytics'],
    reading_time: 5            // расчётное время чтения в минутах
  }
});
```

#### Размер скрипта и влияние на производительность

| Система | Размер скрипта | Cookies | Влияние на CWV |
|---------|---------------|---------|----------------|
| Plausible | ~1 KB | Нет | Минимальное |
| Umami | ~2 KB | Нет | Минимальное |
| Яндекс Метрика | ~35 KB (tag.js) + ~150 KB (Вебвизор runtime) | Да (`_ym_uid`, `_ym_d`, `_ym_isad`) | Умеренное; минимизируется асинхронной и отложенной загрузкой |

**Рекомендация:** Использовать Plausible/Umami как основную аналитику (лёгкий скрипт, без cookies, GDPR-compliant). Яндекс Метрику подключать как дополнительный инструмент для поведенческого анализа и интеграции с Яндексом.

---

## Technical Requirements (TZ)

### 1. General

- **Project name:** Tech Knowledge Base (Строгий Цифровой Сад)
- **Target platforms:** Web (статический сайт)
- **SSG-фреймворк:** Astro 5.x
- **Язык:** TypeScript (strict mode)
- **CSS-фреймворк:** Tailwind CSS 3.x + @tailwindcss/typography
- **Supported browsers:**
  - Chrome 90+ (desktop, mobile)
  - Firefox 90+ (desktop)
  - Safari 15+ (desktop, mobile)
  - Edge 90+
- **Supported devices:**
  - Desktop: >= 1024px (primary)
  - Tablet: 768px -- 1024px
  - Mobile: < 768px
- **Performance requirements (Core Web Vitals):**
  - LCP (Largest Contentful Paint): < 1.5s (цель < 1.0s для статического сайта)
  - FID / INP (Interaction to Next Paint): < 100ms (ожидаемо ~0ms при zero-JS)
  - CLS (Cumulative Layout Shift): < 0.05 (цель 0)
  - TTFB (Time to First Byte): < 200ms (GitHub Pages CDN)
  - Total page weight: < 500 KB (HTML + CSS + шрифты; без JS)
- **Hosting:** GitHub Pages (бесплатный, автоматический HTTPS, CDN от Fastly)
- **CI/CD:** GitHub Actions (сборка + деплой при push в `main`)

### 2. Functional Requirements

| ID | Requirement | Priority | Related Story | Acceptance Criteria |
|----|-------------|----------|---------------|---------------------|
| FR-1 | Инициализация проекта Astro с TypeScript, Tailwind CSS, MDX | MUST | Story 1.1 | Проект создан через `create astro`. Установлены `@astrojs/tailwind`, `@astrojs/mdx`. `tailwind.config.mjs` содержит кастомные шрифты (Unbounded, Geist, Geist Mono) и расширение `borderWidth: {'3': '3px'}`. Команда `npm run dev` запускает dev-сервер без ошибок. |
| FR-2 | CI/CD pipeline для автоматического деплоя на GitHub Pages | MUST | Story 1.2 | Файл `.github/workflows/deploy.yml` запускается при push в `main`. Workflow: checkout -> install -> build -> deploy. Сайт доступен по URL GitHub Pages. `astro.config.mjs` содержит корректные `site` и `base`. |
| FR-3 | Git-репозиторий под версионным контролем | MUST | Story 1.3 | Репозиторий инициализирован. `.gitignore` покрывает `node_modules`, `dist`, `.astro`. Репозиторий запушен на GitHub. |
| FR-4 | Глобальные стили дизайн-системы | MUST | Story 2.1 | Точечная сетка body: `radial-gradient(#d1d5db 1.5px, transparent 1.5px)` с шагом 24px. Стилизованный скроллбар (6px, чёрный thumb). Классы `.bujo-box`, `.bujo-header-box`, `.lined-paper`. Инвертированное выделение текста (selection). Визуальное соответствие прототипу `Сайт3.html`. |
| FR-5 | BaseLayout с sidebar и областью контента | MUST | Story 2.2 | Компонент `BaseLayout.astro`: sidebar w-72 на десктопе, полная ширина на мобильных. Sidebar содержит: заголовок "ИНДЕКС", подзаголовок "ТЕХНИЧЕСКАЯ БАЗА ЗНАНИЙ", блок "Навигация" (Обзор, Все записи), блок "Темы" (облако тегов из Content Collections), подвал "ПУБЛИЧНЫЙ РЕСУРС". Основная область `<main>` с `overflow-y-auto`. |
| FR-6 | Переиспользуемые UI-компоненты: BujoBox, NoteCard, TagBadge | MUST | Story 2.3 | `BujoBox`: border 2px solid black, bg white/95, опциональный заголовок (обычный/инвертированный). `NoteCard`: блок даты слева, заголовок + теги справа, hover-инверсия, является ссылкой. `TagBadge`: font-mono, text-xs, border, является ссылкой на `/tags/[slug]/`. Визуальное соответствие прототипу. |
| FR-7 | Схема Content Collection с Zod-валидацией frontmatter | MUST | Story 3.1 | Файл `src/content/config.ts` с Zod-схемой: `title` (string, required), `date` (date, required), `category` (string, required), `tags` (string[], required), `type` (string, required), `description` (string, optional), `metrics` (object, optional). Директория `src/content/notes/`. Сборка падает при невалидном frontmatter. |
| FR-8 | Миграция 3 записей из прототипа в Markdown/MDX | MUST | Story 3.2 | Три файла в `src/content/notes/`: `haki-dlya-optimizacii-v-1c-analitike.md(x)`, `lokalnye-llm-agenty-dlya-analiza-dokumentov.md(x)`, `patterny-pipelinov-v-airflow.md(x)`. Frontmatter заполнен по схеме FR-7. HTML-разметка адаптирована в Markdown/MDX. Блоки кода в code fences. Списки в Markdown-формате. Кастомные блоки через MDX-компоненты. |
| FR-9 | Главная страница (Overview) с недавними записями | MUST | Story 3.3 | Маршрут `/`. Заголовок "ОБЗОР" (font-display, text-5xl/7xl). CSS Grid md:grid-cols-3. Блок "Недавние записи" (bujo-box, col-span-2): до 10 записей, сортировка по дате desc. Каждая строка: маркер (12px rounded-full bg-black), заголовок, дата (font-mono). Hover: scale маркера, underline заголовка. Клик ведёт на `/notes/[slug]/`. |
| FR-10 | Страница списка всех записей | MUST | Story 3.4 | Маршрут `/notes/`. Заголовок "ВСЕ ЗАПИСИ" (border-b-4). NoteCard для каждой записи, сортировка по дате desc. Hover-инверсия карточки. Клик ведёт на `/notes/[slug]/`. |
| FR-11 | Страницы фильтрации по тегу | MUST | Story 3.5 | Маршрут `/tags/[tag]/`. Статическая генерация для каждого уникального тега. Slug тега -- транслитерация. Заголовок "ТЕМА: #<Тег>" (оригинальное написание). NoteCard для отфильтрованных записей. Клик по тегу в sidebar/карточке ведёт на соответствующую страницу. |
| FR-12 | Детальная страница записи | MUST | Story 3.6 | Маршрут `/notes/[slug]/`. Кнопка "НАЗАД" (font-mono, border-2, иконка arrow-left). Header: bg-black, text-white, метка "ЗАПИСЬ // DD.MM.YYYY", заголовок (font-display, uppercase, text-3xl/5xl), теги (bg-white, text-black, border-white). Body: белый фон, p-8/p-12, рендер Markdown/MDX. Статическая генерация для каждой записи. |
| FR-13 | Адаптивная верстка для мобильных устройств | MUST | Story 4.1 | На < 768px: sidebar как сворачиваемая панель сверху. Сетка главной -- 1 колонка. NoteCard -- вертикальный layout (flex-col). Детальная страница: уменьшенные padding и заголовок. Блоки кода: overflow-x-auto. Минимальный font-size 14px. Touch targets >= 44x44px. |
| FR-14 | SEO мета-теги на всех страницах | SHOULD | Story 5.1 | Уникальный `<title>` (формат: "Заголовок | Tech Knowledge Base"). Meta description (из frontmatter или автогенерация). Open Graph: og:title, og:description, og:type, og:url, og:image. Семантическая разметка: article, header, nav, main, aside, time. `lang="ru"`. |
| FR-15 | Sitemap.xml и robots.txt | SHOULD | Story 5.2 | `@astrojs/sitemap` генерирует sitemap.xml. `public/robots.txt`: `User-agent: * Allow: /` + `Sitemap: https://...`. |
| FR-16 | Синтаксическая подсветка кода (Shiki) | SHOULD | Story 6.1 | Блоки кода рендерятся с подсветкой через Shiki (встроен в Astro). Монохромная тема. Языки: SQL, Python, JavaScript, YAML, Bash. Стилизация: чёрный заголовок (имя файла), mono-шрифт, padding, overflow-x-auto. Inline-код стилизован: font-mono, bg-подложка. |
| FR-17 | Prose-стилизация Markdown-контента | SHOULD | Story 6.2 | `@tailwindcss/typography` настроен. Prose кастомизирован: body -- Geist, заголовки -- Unbounded uppercase, ссылки -- чёрные с подчёркиванием, списки -- чёрные маркеры, hr -- border-b-2 border-black, blockquote -- border-left 2px solid black. |
| FR-18 | RSS-лента | SHOULD | Story 7.1 | `@astrojs/rss` генерирует `rss.xml`. Каждый элемент: title, link, pubDate, description. В sidebar -- иконка/ссылка RSS. |
| FR-19 | Кастомная страница 404 | SHOULD | Story 7.2 | `src/pages/404.astro`. Использует BaseLayout. Заголовок "404" (font-display, text-8xl/9xl). "СТРАНИЦА НЕ НАЙДЕНА" (font-display, bold, uppercase, text-2xl). Пояснительный текст. Кнопка "ВЕРНУТЬСЯ НА ГЛАВНУЮ" (bujo-стиль). |
| FR-20 | Утилита транслитерации для slug-генерации тегов | MUST | TECH-1 | Функция `transliterate(input: string): string` в `src/utils/transliterate.ts`. Маппинг кириллических символов (а-я, А-Я, ё/Ё). Пробелы -> дефисы, удаление спецсимволов, нижний регистр. Примеры: "Оптимизация" -> "optimizaciya", "AI-Агенты" -> "ai-agenty". |
| FR-21 | Self-hosting шрифтов | MUST | TECH-2 | Файлы woff2 в `public/fonts/`: Geist (400, 500, 700), Geist Mono (400, 700), Unbounded (700, 900). `@font-face` в `global.css`. `font-display: swap`. Нет зависимости от Google Fonts CDN. |
| FR-22 | Константы сайта | MUST | TECH-3 | Файл `src/consts.ts`: SITE_NAME, SITE_DESCRIPTION, SITE_URL, AUTHOR_NAME, DEFAULT_OG_IMAGE. Используется в SEOHead, BaseLayout, RSS. |
| FR-23 | Мобильная адаптация sidebar | MUST | TECH-7 | На < 768px: sidebar как сворачиваемая панель (details/summary или минимальный inline JS). Заголовок "ИНДЕКС" + кнопка раскрытия. Раскрытие: блоки "Навигация" и "Темы". Zero-JS предпочтителен. |

### 3. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| NFR-1 | Performance | Largest Contentful Paint (LCP) < 1.5s на desktop и mobile | Измерение: Lighthouse, PageSpeed Insights |
| NFR-2 | Performance | Cumulative Layout Shift (CLS) < 0.05 | Измерение: Lighthouse; достигается через font-display: swap и фиксированные размеры layout |
| NFR-3 | Performance | Total page weight (HTML + CSS + шрифты) < 500 KB для любой страницы | Измерение: DevTools Network tab; шрифты ~300-500 KB, CSS ~20-50 KB после purge, HTML < 50 KB |
| NFR-4 | Performance | Zero client-side JavaScript (кроме опционального inline-скрипта для мобильного меню ~20 строк) | Измерение: DevTools; Astro zero-JS по умолчанию |
| NFR-5 | Performance | Time to First Byte (TTFB) < 200ms | Обеспечивается CDN GitHub Pages (Fastly) |
| NFR-6 | Accessibility | Контрастность текста >= 7:1 (WCAG AAA) | Монохромная палитра (#000 на #FFF) = 21:1 -- выполняется автоматически |
| NFR-7 | Accessibility | Все интерактивные элементы фокусируемы через Tab, с видимым focus-ring | `outline: 2px solid #000; outline-offset: 2px` на `:focus-visible` |
| NFR-8 | Accessibility | Семантическая HTML-разметка: nav, main, article, aside, header, time | Проверка: axe DevTools, Lighthouse Accessibility score >= 95 |
| NFR-9 | Accessibility | Touch targets >= 44x44px на мобильных устройствах | WCAG 2.1 Success Criterion 2.5.5 |
| NFR-10 | Accessibility | Атрибут lang="ru" на html | Для корректной работы screen readers и синтезаторов речи |
| NFR-11 | Maintainability | Контент в Markdown/MDX файлах, отделён от представления | Добавление новой записи = создание .md файла с frontmatter + git push |
| NFR-12 | Maintainability | Типизация TypeScript strict для всех компонентов и утилит | `tsconfig.json` с `strict: true`; frontmatter валидируется Zod-схемой |
| NFR-13 | Reliability | Сайт доступен при недоступности внешних CDN (Google Fonts, unpkg) | Шрифты self-hosted, иконки через npm-пакет, Tailwind через build process |
| NFR-14 | Reliability | Время сборки < 60 секунд для 20 записей | Измерение: `time npm run build` в CI |
| NFR-15 | Scalability | Архитектура поддерживает 100+ записей без изменений в коде | Content Collections, статическая генерация, облако тегов |
| NFR-16 | Compatibility | Корректная обработка кириллицы в URL, тегах, метаданных | Транслитерация для slug'ов, оригинальные названия в UI |
| NFR-17 | SEO | Lighthouse SEO score >= 95 | Мета-теги, семантика, sitemap, robots.txt, lang |

---

## SEO Requirements

### URL Structure

| Page | URL Pattern | Title Template | Meta Description |
|------|------------|----------------|-----------------|
| Главная | `/` | `Обзор \| Tech Knowledge Base` | "Публичная техническая база знаний: архитектурные решения, оптимизация, пайплайны данных, AI-агенты." |
| Все записи | `/notes/` | `Все записи \| Tech Knowledge Base` | "Каталог всех технических записей: BI-оптимизация, пайплайны данных, LLM-агенты, Airflow и другие темы." |
| Детальная запись | `/notes/{transliterated-slug}/` | `{Заголовок записи} \| Tech Knowledge Base` | Из поля `description` frontmatter или первые 160 символов контента |
| Фильтр по тегу | `/tags/{transliterated-tag}/` | `Тема: {Тег} \| Tech Knowledge Base` | "Записи по теме {Тег}: технические решения, практики и эксперименты." |
| 404 | `/404` | `404 -- Страница не найдена \| Tech Knowledge Base` | Не индексируется (noindex) |
| RSS | `/rss.xml` | -- | -- |
| Sitemap | `/sitemap-index.xml` | -- | -- |

**Правила формирования URL:**
- Slug записей: транслитерация заголовка, нижний регистр, дефисы вместо пробелов. Определяется именем файла в `src/content/notes/`. Пример: "Хаки для оптимизации в 1С Аналитике" -> `haki-dlya-optimizacii-v-1c-analitike`
- Slug тегов: транслитерация через утилиту `transliterate()`. Пример: "Оптимизация" -> `optimizaciya`, "AI-Агенты" -> `ai-agenty`, "1C-Analytics" -> `1c-analytics`
- Trailing slash обязателен (Astro default `trailingSlash: 'always'`)
- Нет URL-кодированных кириллических символов в путях

### Technical SEO

**Sitemap:**
- Генерируется автоматически через `@astrojs/sitemap`
- Включает все страницы: `/`, `/notes/`, `/notes/[slug]/`, `/tags/[tag]/`
- Не включает: `/404`, `/rss.xml`
- Формат: sitemap-index.xml со ссылками на sitemap-N.xml
- Обновляется при каждой сборке

**Robots.txt:**
```
User-agent: *
Allow: /

Sitemap: https://<domain>/sitemap-index.xml
```
- Размещается в `public/robots.txt`
- Разрешает полную индексацию
- Содержит абсолютный URL sitemap

**Structured Data (Schema.org):**
- `WebSite` -- на главной странице:
  - `name`: "Tech Knowledge Base"
  - `url`: базовый URL
  - `description`: описание сайта
  - `inLanguage`: "ru"
- `BlogPosting` -- на каждой детальной странице записи:
  - `headline`: заголовок записи
  - `datePublished`: дата из frontmatter
  - `author.name`: имя автора (из `consts.ts`)
  - `description`: описание записи
  - `keywords`: теги записи
  - `inLanguage`: "ru"
- `BreadcrumbList` -- на страницах записей и тегов:
  - Главная -> Все записи -> Текущая запись
  - Главная -> Тема: {Тег}
- Формат: JSON-LD в `<script type="application/ld+json">` внутри `<head>`

**Canonical URLs:**
- Каждая страница имеет `<link rel="canonical" href="...">` с абсолютным URL
- Генерируется компонентом `SEOHead.astro`

**Core Web Vitals targets:**
- LCP < 1.5s (цель < 1.0s)
- INP < 100ms (ожидаемо ~0ms)
- CLS < 0.05 (цель 0)

**Hreflang:**
- Не требуется (одноязычный сайт, `lang="ru"`)

### Content SEO

**H1 rules:**
- Каждая страница имеет ровно один `<h1>`
- Главная: "Обзор" (визуально, внутри `<h2>` в прототипе -- при переносе в Astro исправить на `<h1>`)
- Все записи: "Все записи"
- Фильтр по тегу: "Тема: #{Тег}"
- Детальная: заголовок записи из frontmatter
- 404: "404"
- `<h1>` уникален на каждой странице, содержит основное ключевое слово страницы

**Heading hierarchy:**
- h1 -- заголовок страницы (один на страницу)
- h2 -- заголовки секций внутри контента записи (например, "Решения", "Чек-лист")
- h3 -- подзаголовки секций
- Не допускается пропуск уровней (h1 -> h3 без h2)

**Image alt text:**
- v1 не содержит изображений в контенте (только текст и код)
- OG-изображение (`og-default.png`): alt не применим (meta-тег)
- При добавлении изображений в v2: обязательный alt-текст, описывающий содержание изображения на русском языке
- Формат: краткое, информативное описание (не "картинка", не "изображение")

**Internal linking strategy:**
- Теги как основной механизм внутренней перелинковки: каждая запись связана с другими через общие теги
- Sidebar: постоянная ссылка на главную и список записей с каждой страницы
- Облако тегов в sidebar: обеспечивает доступ к тематическим подборкам
- Кнопка "НАЗАД" на детальной странице: ведёт на главную (обратная навигация)
- v2 (рекомендация): добавить блок "Связанные записи" внизу детальной страницы (записи с общими тегами)

**Meta robots:**
- По умолчанию: `index, follow` (не нужно указывать явно -- браузеры и боты используют это значение по умолчанию)
- Страница 404: `<meta name="robots" content="noindex">` -- исключить из индекса

**Open Graph:**
- `og:type`: "website" для главной и списков, "article" для записей
- `og:title`: совпадает с `<title>` без суффикса "| Tech Knowledge Base"
- `og:description`: совпадает с meta description
- `og:url`: каноническая URL страницы
- `og:image`: дефолтное изображение из `public/og-default.png` (рекомендуемый размер: 1200x630px)
- `og:locale`: "ru_RU"
- `og:site_name`: "Tech Knowledge Base"

**Twitter Card (опционально):**
- `twitter:card`: "summary_large_image"
- `twitter:title`, `twitter:description`, `twitter:image` -- аналогичны OG

---

## Security Requirements (IB)

> **Контекст:** Это статический сайт без серверной части, без базы данных, без аутентификации, без форм ввода, без хранения пользовательских данных. Поверхность атаки минимальна. Требования ниже адресуют реальные векторы угроз для данной архитектуры.

### Authentication & Authorization

**Не применимо для v1.**

- Сайт не имеет системы аутентификации -- нет пользовательских аккаунтов, нет логина, нет ролей
- Контент публикуется через `git push` в защищённый репозиторий GitHub
- Доступ к репозиторию контролируется через GitHub: SSH-ключи или Personal Access Token автора
- Рекомендация: включить 2FA на GitHub-аккаунте автора (единственная точка контроля доступа к контенту)

### Data Protection

**Пользовательские данные:**
- Сайт не собирает персональные данные напрямую
- Plausible/Umami: cookieless analytics -- нет cookies, нет PII
- Яндекс Метрика: устанавливает cookies (`_ym_uid`, `_ym_d`, `_ym_isad`), записывает действия пользователей через Вебвизор. Данные обрабатываются на серверах Яндекса. IP-адреса анонимизируются Яндексом
- Нет форм ввода, нет комментариев, нет регистрации
- IP-адреса: обрабатываются GitHub Pages CDN (Fastly) стандартно, не сохраняются на стороне сайта

**Контент (данные автора):**
- Markdown-файлы хранятся в Git-репозитории на GitHub
- Резервное копирование: обеспечивается Git (распределённая система контроля версий -- копия на каждой машине, где клонирован репозиторий)
- Рекомендация: периодически клонировать репозиторий на отдельный носитель / в отдельный Git-хостинг (GitLab, Bitbucket) как дополнительный backup

**Шифрование:**
- HTTPS: обеспечивается GitHub Pages автоматически (сертификат Let's Encrypt)
- HSTS: поддерживается GitHub Pages
- Все ресурсы (HTML, CSS, шрифты) загружаются по HTTPS
- Нет необходимости в шифровании данных at rest (публичный контент)

### OWASP Top 10 Mitigations

| Threat | Relevance | Mitigation | Implementation |
|--------|-----------|------------|----------------|
| A01: Broken Access Control | Низкая. Нет авторизации на сайте. Единственный вектор -- несанкционированный push в репозиторий. | Защита GitHub-аккаунта | 2FA на GitHub. Branch protection rules (require PR review -- опционально для solo-разработчика). Не хранить токены в коде. |
| A02: Cryptographic Failures | Низкая. Нет хранения секретов или PII. | HTTPS для всего трафика | GitHub Pages обеспечивает HTTPS автоматически. Не использовать HTTP-ссылки на внешние ресурсы (mixed content). |
| A03: Injection | Минимальная. Нет пользовательского ввода. Контент создаётся автором. | Санитизация Markdown-рендера | Astro/remark по умолчанию санитизирует HTML в Markdown. Не использовать `set:html` с непроверенными данными в Astro-компонентах. MDX-компоненты должны быть авторскими, не импортировать из непроверенных источников. |
| A04: Insecure Design | Минимальная для статического сайта. | Принцип минимализма | Zero-JS по умолчанию. Нет клиентских API-вызовов. Нет динамической генерации контента на клиенте. |
| A05: Security Misconfiguration | Средняя. Неправильная конфигурация GitHub Pages, CI/CD или заголовков. | Корректная конфигурация | Security headers (см. раздел ниже). Не хранить секреты в репозитории. Ограничить permissions в GitHub Actions workflow. |
| A06: Vulnerable Components | Средняя. npm-зависимости могут содержать уязвимости. | Управление зависимостями | Регулярно запускать `npm audit`. Фиксировать версии в `package-lock.json`. Минимизировать количество зависимостей. Обновлять зависимости при выявлении CVE. |
| A07: Identification & Auth Failures | Не применимо. Нет аутентификации на сайте. | -- | -- |
| A08: Software & Data Integrity Failures | Средняя. Supply chain attack через npm или GitHub Actions. | Защита CI/CD pipeline | Использовать фиксированные версии Actions (`@vN` или SHA). Использовать `npm ci` (не `npm install`) в CI. Проверять `package-lock.json`. Не запускать произвольные скрипты из непроверенных источников. |
| A09: Security Logging & Monitoring | Низкая для статического сайта. | Мониторинг доступности | GitHub Pages не предоставляет логи. Использовать аналитику (Plausible/Umami, Яндекс Метрика) для мониторинга аномального трафика. Яндекс.Вебмастер: раздел "Безопасность и нарушения" для оповещений о проблемах. Подписаться на GitHub Security Advisories для зависимостей. |
| A10: Server-Side Request Forgery (SSRF) | Не применимо. Нет серверной части. | -- | -- |

### Security Headers

GitHub Pages не позволяет настраивать HTTP-заголовки напрямую. Рекомендации для реализации через `<meta>` теги или при переезде на Netlify/Vercel:

| Header | Value | Реализация |
|--------|-------|------------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://plausible.io https://mc.yandex.ru https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru; font-src 'self'; connect-src 'self' https://plausible.io https://mc.yandex.ru https://mc.yandex.com; frame-ancestors 'none'` | `<meta http-equiv="Content-Security-Policy">` в BaseLayout. `'unsafe-inline'` для Tailwind и минимального inline JS. `plausible.io` -- если используется облачный Plausible. Домены Яндекс Метрики: `mc.yandex.ru` (основной скрипт и пиксель), `mc.yandex.com` (альтернативный домен), `yastatic.net` (статические ресурсы Вебвизора). |
| `X-Content-Type-Options` | `nosniff` | Устанавливается GitHub Pages автоматически |
| `X-Frame-Options` | `DENY` | Через CSP `frame-ancestors 'none'` (meta-тег) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `<meta name="referrer" content="strict-origin-when-cross-origin">` в BaseLayout |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | `<meta http-equiv="Permissions-Policy">` -- ограничение доступа к API устройств (не нужны для блога) |

### CI/CD Security

| Requirement | Implementation |
|-------------|----------------|
| Минимальные permissions в GitHub Actions | `permissions: contents: read, pages: write, id-token: write` -- не давать лишних прав |
| Фиксированные версии Actions | Использовать `actions/checkout@v4`, `withastro/action@v3` с конкретными версиями, не `@latest` |
| Запрет push в main без CI | Опционально: branch protection rule `Require status checks to pass` (для solo-разработчика -- по желанию) |
| Секреты | Не хранить токены/ключи в коде. Использовать GitHub Secrets для переменных окружения (если потребуются). `GITHUB_TOKEN` -- встроенный, не требует настройки для GitHub Pages deploy. |
| npm ci | Использовать `npm ci` вместо `npm install` в CI для детерминированных сборок на основе `package-lock.json` |

### Supply Chain Security

| Requirement | Implementation |
|-------------|----------------|
| Минимум зависимостей | Использовать встроенные возможности Astro (Shiki, Content Collections) вместо дополнительных пакетов |
| Аудит зависимостей | Запускать `npm audit` при добавлении новых зависимостей и периодически (раз в месяц) |
| Lockfile | `package-lock.json` должен быть в репозитории и использоваться в CI (`npm ci`) |
| Dependabot | Включить GitHub Dependabot для автоматических PR при обнаружении уязвимостей в зависимостях |
| Подписи коммитов | Рекомендация (не обязательно для solo): подписывать коммиты GPG-ключом |

### Compliance

**GDPR / Закон о персональных данных (152-ФЗ):**
- Сайт не собирает персональные данные напрямую -- требования к обработке ПД минимальны
- При использовании cookieless-аналитики (Plausible, Umami) -- баннер согласия на cookies НЕ требуется
- При использовании Google Analytics -- ТРЕБУЕТСЯ баннер согласия, обработка ПД, политика конфиденциальности. Это одна из причин рекомендации Plausible/Umami
- **Яндекс Метрика использует cookies** (`_ym_uid`, `_ym_d`, `_ym_isad` и др.). По законодательству РФ (152-ФЗ) и GDPR:
  - Рекомендуется добавить уведомление о cookies (минимальный баннер) при подключении Яндекс Метрики
  - В политике конфиденциальности / странице "О сайте" указать: используется Яндекс Метрика для анализа посещаемости, данные обрабатываются ООО "ЯНДЕКС" в соответствии с [Пользовательским соглашением Яндекс Метрики](https://yandex.ru/legal/metrica_termsofuse/)
  - Вебвизор записывает действия пользователей -- упомянуть в политике конфиденциальности
- Рекомендация: добавить минимальную страницу "О сайте" или footer-текст с указанием автора, используемых систем аналитики и отсутствия прямого сбора персональных данных

**Data Retention:**
- Контент: хранится бессрочно в Git-репозитории
- Аналитика (при подключении): Plausible/Umami -- данные агрегированы, нет PII, хранение определяется настройками сервиса
- Яндекс Метрика: записи Вебвизора хранятся 15 дней; агрегированные данные -- бессрочно; cookies `_ym_uid` действует 1 год, `_ym_d` -- 1 год
- Логи сервера: контролируются GitHub Pages (не управляется автором)

---

## Quality Checklist

- [x] GA events покрывают все ключевые user interactions из use cases:
  - UC-1 (главная): `pageview`, `sidebar_nav`
  - UC-2 (все записи): `pageview`, `note_view`
  - UC-3 (фильтр по тегу): `tag_filter`
  - UC-4 (чтение записи): `note_view`, `scroll_depth`, `back_button`, `outbound_link`
  - UC-5 (sidebar навигация): `sidebar_nav`
  - UC-6 (404): `404_hit`
  - UC-7 (RSS): `rss_subscribe`
  - UC-8 (индексация): покрыта через SEO requirements
  - UC-9 (мобильные): покрыта через dimension `device_type`
- [x] TZ functional requirements трассируются к backlog stories:
  - Все 13 MUST stories покрыты: 1.1 (FR-1), 1.2 (FR-2), 1.3 (FR-3), 2.1 (FR-4), 2.2 (FR-5), 2.3 (FR-6), 3.1 (FR-7), 3.2 (FR-8), 3.3 (FR-9), 3.4 (FR-10), 3.5 (FR-11), 3.6 (FR-12), 4.1 (FR-13)
  - Все 6 SHOULD stories покрыты: 5.1 (FR-14), 5.2 (FR-15), 6.1 (FR-16), 6.2 (FR-17), 7.1 (FR-18), 7.2 (FR-19)
  - Все 7 TECH stories покрыты: TECH-1 (FR-20), TECH-2 (FR-21), TECH-3 (FR-22), TECH-4 (входит в FR-4), TECH-5 (входит в FR-17), TECH-6 (входит в FR-16), TECH-7 (FR-23)
- [x] Non-functional requirements имеют измеримые метрики (LCP < 1.5s, CLS < 0.05, TTFB < 200ms, page weight < 500 KB, Lighthouse scores >= 95, touch targets >= 44px, build time < 60s)
- [x] SEO requirements специфичны для проекта:
  - URL-структура с транслитерацией кириллических тегов
  - Title templates для каждого типа страницы
  - Schema.org типы: WebSite, BlogPosting, BreadcrumbList
  - Meta description шаблоны для каждого маршрута
  - Content SEO: H1 rules, heading hierarchy, internal linking через теги
- [x] Яндекс Метрика интегрирована в аналитический план:
  - Счётчик с noscript-фолбеком, рекомендации по асинхронной загрузке
  - Цели (Goals) замаплены на все события из основного GA-плана
  - Вебвизор, карта кликов, карта скроллов -- конфигурация и рекомендации по использованию
  - Интеграция с Яндекс.Вебмастером: мета-тег верификации, отправка sitemap
  - Контентная аналитика и параметры содержания
  - Влияние на производительность оценено; рекомендации по минимизации
- [x] Security requirements адресуют конкретную архитектуру (Astro SSG + GitHub Pages):
  - Нет избыточных требований к несуществующим auth/database/API
  - Фокус на реальных векторах: supply chain (npm), CI/CD security (GitHub Actions), security headers
  - CSP настроен под конкретный стек (Tailwind inline styles, Plausible script, Яндекс Метрика домены)
  - Compliance обновлён с учётом cookies Яндекс Метрики (баннер, политика конфиденциальности)
- [x] OWASP mitigations релевантны tech stack:
  - A03 (Injection): санитизация Markdown в Astro/remark
  - A05 (Misconfiguration): security headers через meta-теги (ограничение GitHub Pages)
  - A06 (Vulnerable Components): npm audit, lockfile, Dependabot
  - A08 (Supply Chain): фиксированные версии Actions, npm ci
  - A09 (Logging): Яндекс.Вебмастер для мониторинга безопасности
  - Неприменимые угрозы (A07, A10) явно помечены как "не применимо"
