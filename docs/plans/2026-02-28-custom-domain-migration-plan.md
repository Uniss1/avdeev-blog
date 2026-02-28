# Custom Domain Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate avdeev-blog from GitHub Pages subdirectory (`uniss1.github.io/avdeev-blog`) to custom domain (`avdeev.blog`) so styles and assets load correctly.

**Architecture:** Remove `base: '/avdeev-blog'` from Astro config and set `site` to the custom domain. Then remove all `BASE_URL` workarounds from 6 files, replacing them with plain absolute paths. The site will serve from root `/` instead of `/avdeev-blog/`.

**Tech Stack:** Astro 5.18, GitHub Pages, custom domain via reg.ru DNS

---

### Task 1: Update Astro config

**Files:**
- Modify: `astro.config.mjs:7-8`

**Step 1: Update site and remove base**

Replace lines 7-8 in `astro.config.mjs`:

```javascript
// Before:
  site: 'https://uniss1.github.io',
  base: '/avdeev-blog',

// After:
  site: 'https://avdeev.blog',
```

**Step 2: Verify config is valid**

Run: `cd /home/valentin/projects/avdeev-blog && npx astro check 2>&1 | head -20`
Expected: No config errors (type errors in .astro files are OK to ignore here)

**Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "fix: set site to avdeev.blog, remove base path"
```

---

### Task 2: Remove BASE_URL from components

**Files:**
- Modify: `src/components/NoteCard.astro:11,17`
- Modify: `src/components/TagBadge.astro:10,14`
- Modify: `src/components/Sidebar.astro:7,29,35,88,94`
- Modify: `src/components/BackButton.astro:4,8`

**Step 1: Fix NoteCard.astro**

Remove line 11 (`const base = ...`) and on line 17 replace `${base}notes/${note.slug}/` with `/notes/${note.slug}/`:

```astro
---
import TagBadge from './TagBadge.astro';
import { formatDate } from '../utils/date';
import type { CollectionEntry } from 'astro:content';

interface Props {
  note: CollectionEntry<'notes'>;
}

const { note } = Astro.props;
const dateShort = formatDate(note.data.date, 'short');
const year = note.data.date.getFullYear();
---

<a
  href={`/notes/${note.slug}/`}
```

**Step 2: Fix TagBadge.astro**

Remove line 10 (`const base = ...`) and on line 14 replace `${base}tags/${tagSlug}/` with `/tags/${tagSlug}/`:

```astro
const { tag } = Astro.props;
const tagSlug = transliterate(tag);
---

<a
  href={`/tags/${tagSlug}/`}
```

**Step 3: Fix Sidebar.astro**

Remove line 7 (`const base = ...`). Replace all `{base}` and `{`${base}notes/`}` references:
- Line 29: `href={base}` → `href="/"`
- Line 35: `href={`${base}notes/`}` → `href="/notes/"`
- Line 88: `href={base}` → `href="/"`
- Line 94: `href={`${base}notes/`}` → `href="/notes/"`

**Step 4: Fix BackButton.astro**

Remove line 4 (`const base = ...`) and on line 8 replace `href={base}` with `href="/"`:

```astro
---
import { ArrowLeft } from '@lucide/astro';
---

<a
  href="/"
```

**Step 5: Commit**

```bash
git add src/components/NoteCard.astro src/components/TagBadge.astro src/components/Sidebar.astro src/components/BackButton.astro
git commit -m "fix: remove BASE_URL hacks from components, use absolute paths"
```

---

### Task 3: Remove BASE_URL from pages

**Files:**
- Modify: `src/pages/index.astro:10,30`
- Modify: `src/pages/404.astro:4,20`

**Step 1: Fix index.astro**

Remove line 10 (`const base = ...`). On line 30 replace `${base}notes/${note.slug}/` with `/notes/${note.slug}/`:

```astro
const notes = (await getCollection('notes'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 10);
---
```

And in the template:
```astro
href={`/notes/${note.slug}/`}
```

**Step 2: Fix 404.astro**

Remove line 4 (`const base = ...`). On line 20 replace `href={base}` with `href="/"`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
```

And in the template:
```astro
<a
  href="/"
  class="mt-10 inline-flex items-center gap-2 ..."
>
```

**Step 3: Commit**

```bash
git add src/pages/index.astro src/pages/404.astro
git commit -m "fix: remove BASE_URL hacks from pages, use absolute paths"
```

---

### Task 4: Build and verify locally

**Step 1: Install dependencies (if needed)**

Run: `cd /home/valentin/projects/avdeev-blog && npm ci`

**Step 2: Build the site**

Run: `npm run build`
Expected: Build succeeds with no errors. Output in `dist/`.

**Step 3: Verify no BASE_URL references remain**

Run: `grep -r "BASE_URL" src/`
Expected: No output (no remaining references).

**Step 4: Verify built output uses root paths**

Run: `grep -r "avdeev-blog" dist/ | head -10`
Expected: No output (no `/avdeev-blog/` prefixes in built files).

**Step 5: Preview locally**

Run: `npm run preview`
Open `http://localhost:4321/` — verify styles load, navigation works, links point to `/notes/...` not `/avdeev-blog/notes/...`.

**Step 6: Commit build verification (no file changes expected)**

If all checks pass, no commit needed for this task.

---

### Task 5: Push and verify deployment

**Step 1: Push to main**

Run: `git push origin main`

**Step 2: Check GitHub Actions**

Run: `gh run list --limit 1`
Expected: Deploy workflow triggered and succeeds.

**Step 3: Verify DNS TXT record propagated**

Run: `dig +short _github-pages-challenge-Uniss1.avdeev.blog TXT`
Expected: Returns `"3ad3aa1a34fb806cf07f2940b29d60"`

**Step 4: Verify site at custom domain**

Open `https://avdeev.blog` — verify:
- Styles load correctly (no broken CSS)
- Fonts render (Geist, Unbounded)
- Navigation links work (`/notes/`, `/tags/...`)
- 404 page works at `https://avdeev.blog/nonexistent`
