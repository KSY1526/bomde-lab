// 글 목록 카드 썸네일: /thumb/<글 id>.png (대표 숫자만, 2026-10-18)
import type { APIContext } from 'astro';
import { publishedPosts } from '../../lib/posts';
import { thumbPng, type Stat } from '../../lib/og';

export async function getStaticPaths() {
  const posts = await publishedPosts();
  return posts.map((p) => ({ params: { slug: p.id }, props: { stat: p.data.stat } }));
}

export async function GET({ props }: APIContext) {
  const png = await thumbPng((props as { stat?: Stat }).stat);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
}
