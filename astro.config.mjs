// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://ksy1526.github.io/bomde-lab (도메인 없음, 사용자 결정 2026-10-10)
export default defineConfig({
  site: 'https://ksy1526.github.io',
  base: '/bomde-lab',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});
