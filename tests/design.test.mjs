import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const readProjectFile = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), 'utf8');

test('home page exposes an editorial intro and metrics rail', () => {
  const homeHtml = readProjectFile('dist/index.html');

  assert.match(homeHtml, /data-home-intro/);
  assert.match(homeHtml, /data-home-metrics/);
});

test('sidebar marks the active navigation item for overview and notes pages', () => {
  const homeHtml = readProjectFile('dist/index.html');
  const notesHtml = readProjectFile('dist/notes/index.html');

  assert.match(homeHtml, /href="\/avdeev-blog\/"[^>]*aria-current="page"/);
  assert.match(notesHtml, /href="\/avdeev-blog\/notes\/"[^>]*aria-current="page"/);
});

test('article page exposes a summary rail with note description and metric block', () => {
  const noteHtml = readProjectFile('dist/notes/haki-dlya-optimizacii-v-1c-analitike/index.html');

  assert.match(noteHtml, /data-note-summary/);
  assert.match(noteHtml, /data-note-metric/);
  assert.match(noteHtml, /Время запроса \(мс\)/);
  assert.match(noteHtml, /320/);
});

test('article template and global styles include mobile overflow protections', () => {
  const noteTemplate = readProjectFile('src/pages/notes/[...slug].astro');
  const globalCss = readProjectFile('src/styles/global.css');

  assert.match(noteTemplate, /break-words/);
  assert.match(noteTemplate, /p-5 sm:p-8 md:p-12/);
  assert.doesNotMatch(
    globalCss,
    /\.bujo-box\s*\{\s*max-width:\s*100%;\s*overflow-x:\s*auto;\s*\}/m,
  );
});
