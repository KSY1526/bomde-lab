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
    // 이 글로 만든 유튜브 영상(2026-10-25). 글 끝 "이 글 영상으로 보기"에 내장(글당 한 편, 롱폼 우선). id = 영상 주소의 11자, type = long(가로)·short(쇼츠)
    // 영상을 올리면 shortform-video 스킬 마지막 단계에서 적는다. 영상↔글 대응 전체는 docs/유튜브/영상-글-대응.md
    youtube: z.array(z.object({ id: z.string(), type: z.enum(['long', 'short']) })).default([]),
    // 데이터 기준일 — 스냅샷 관리용. 화면에는 표시하지 않는다(데이터 공개 원칙 4)
    dataUntil: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
