import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // 내용을 크게 고친 날(선택). sitemap lastmod에 쓰인다
    updated: z.coerce.date().optional(),
    category: z.enum(['season', 'player', 'deep', 'metrics', 'game']),
    tags: z.array(z.string()).default([]),
    // 글 끝 "다음에 읽을 글"에 먼저 보일 기존 글 id(파일 이름). 글을 쓸 때 고른다(bomde-writing 스킬)
    related: z.array(z.string()).default([]),
    // 데이터 기준일 — 스냅샷 관리용. 화면에는 표시하지 않는다(데이터 공개 원칙 4)
    dataUntil: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
