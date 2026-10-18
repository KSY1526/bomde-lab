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
    // 대표 숫자(2026-10-18). value·label = 공유 썸네일(숫자 + 한 줄 설명).
    // 글 카드 썸네일은 short(맨 위 짧은 이름, 10자 안팎) + value, 비교 값이면 items(숫자 v + 아래 꼬리표 cap)와 sep(→·vs·:)
    stat: z.object({
      value: z.string(),
      label: z.string(),
      short: z.string().optional(),
      items: z.array(z.object({ v: z.string(), cap: z.string() })).optional(),
      sep: z.string().optional(),
    }).optional(),
    // 데이터 기준일 — 스냅샷 관리용. 화면에는 표시하지 않는다(데이터 공개 원칙 4)
    dataUntil: z.string(),
    draft: z.boolean().default(false),
  }),
});

// 지표 사전(2026-10-18, FanGraphs Library 방식). 글 본문에서 지표 이름이 처음 나오면 빌드 때 이 페이지로 링크된다(src/lib/glossary-links.mjs)
const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    // 다른 이름(영문 약자 등). 제목 옆에 작게
    aka: z.string().optional(),
    // 한 줄 정의 — 사전 목록·검색 설명
    summary: z.string(),
    group: z.enum(['타격', '투구', '경기 상황', '공통']),
    order: z.number(),
    // 글 본문에서 링크를 걸 표기들(긴 것부터 맞춘다)
    match: z.array(z.string()),
    // 이 지표를 다룬 글 id
    posts: z.array(z.string()).default([]),
    // 같이 볼 지표 id
    see: z.array(z.string()).default([]),
  }),
});

export const collections = { posts, glossary };
