import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['season']),
    tags: z.array(z.string()).default([]),
    // 데이터 기준일 — 스냅샷 관리용. 화면에는 표시하지 않는다(데이터 공개 원칙 4)
    dataUntil: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
