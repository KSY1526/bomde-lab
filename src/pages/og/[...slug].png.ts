// 공유 썸네일: /og/<글 id>.png, 글이 아닌 페이지는 /og/default.png
import type { APIContext } from 'astro';
import { publishedPosts } from '../../lib/posts';
import { CATEGORIES, SITE } from '../../lib/site';
import { ogPng } from '../../lib/og';

export async function getStaticPaths() {
  const posts = await publishedPosts();
  return [
    { params: { slug: 'default' }, props: { title: SITE.description.split('. ')[0], label: undefined } },
    ...posts.map((p) => ({ params: { slug: p.id }, props: { title: p.data.title, label: CATEGORIES[p.data.category], stat: p.data.stat } })),
  ];
}

export async function GET({ props }: APIContext) {
  const png = await ogPng(props as Parameters<typeof ogPng>[0]);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
}
