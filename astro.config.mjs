// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// sitemap lastmod: 글 frontmatter의 updated(없으면 date). 검색엔진이 다시 수집할 때 참고한다 (2026-10-16)
const POSTS_DIR = new URL('./src/content/posts/', import.meta.url);
const lastmod = Object.fromEntries(
  readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const fm = readFileSync(new URL(f, POSTS_DIR), 'utf8').split('---')[1] ?? '';
      const get = (k) => fm.match(new RegExp(`^${k}:\\s*["']?([0-9-]{10})`, 'm'))?.[1];
      return [f.replace(/\.mdx?$/, ''), get('updated') ?? get('date')];
    }),
);

// GitHub Pages + 개인 도메인 https://bomdelab.com (2026-10-18). 옛 주소 ksy1526.github.io/bomde-lab/... 는 GitHub가 같은 경로로 301 이동시킨다
export default defineConfig({
  site: 'https://bomdelab.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const slug = item.url.match(/\/posts\/([^/]+)\/$/)?.[1];
        if (slug && lastmod[slug]) item.lastmod = lastmod[slug];
        return item;
      },
    }),
  ],
});
