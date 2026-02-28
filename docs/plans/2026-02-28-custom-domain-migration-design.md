# Custom Domain Migration Design

## Problem

The site has conflicting configuration:
- `astro.config.mjs` points to `https://uniss1.github.io` with `base: '/avdeev-blog'`
- `src/consts.ts` and `public/CNAME` point to `https://avdeev.blog`

This causes styles and assets to load from `/avdeev-blog/...` paths that don't exist on the custom domain.

Additionally, the DNS TXT record for GitHub Pages verification was misconfigured (doubled domain suffix).

## Solution

### Code Changes

1. **`astro.config.mjs`**: Set `site: 'https://avdeev.blog'`, remove `base: '/avdeev-blog'`
2. **6 component/page files**: Remove `BASE_URL` hacks, use plain absolute paths (`/...`)
   - `src/components/NoteCard.astro`
   - `src/components/TagBadge.astro`
   - `src/components/Sidebar.astro`
   - `src/components/BackButton.astro`
   - `src/pages/index.astro`
   - `src/pages/404.astro`
3. **`src/consts.ts`** and **`public/CNAME`**: No changes needed (already correct)

### DNS Changes (done manually in reg.ru)

| Record | Name | Value | Status |
|--------|------|-------|--------|
| A x4 | `@` | `185.199.{108-111}.153` | OK |
| CNAME | `www` | `uniss1.github.io.` | OK |
| TXT | `_github-pages-challenge-Uniss1` | `3ad3aa1a34fb806cf07f2940b29d60` | Fixed (was doubled domain) |

### Post-deploy

After DNS propagation, verify custom domain in GitHub Settings > Pages.
