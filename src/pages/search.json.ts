import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import Thumb from '../components/Thumb.astro';
import { publishedPosts } from '../lib/posts';
import { CATEGORIES, formatDate } from '../lib/site';

// 글 검색 색인(2026-10-25). 헤더 검색 창(Search.astro)이 처음 열릴 때 받아 브라우저 안에서 찾는다.
// 크봇 서버(server/llm.py)도 배포된 이 파일을 읽어 "발행된 글 목록"으로 쓴다 → 초안은 들어가지 않는다.
// text = 글 본문을 그린 HTML에서 표를 뺀 글자(검색·미리보기 문장용), tables = 표 안 글자(검색에만, 선수 이름 등).
// MDX 식({d.wins} 등)도 값으로 들어간다. thumb = 글 목록과 같은 썸네일(Thumb, 링크 없는 span) HTML → 검색 결과 왼쪽(2026-10-26 사용자 요청).
// 썸네일 CSS는 Search.astro가 모든 페이지에 싣는다. stat이 없는 글은 thumb도 없다
function plain(html: string): string {
  return html
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  const posts = await publishedPosts();
  const container = await AstroContainer.create({ renderers: await loadRenderers([mdxRenderer()]) });
  const items = await Promise.all(posts.map(async (p) => {
    const html = await container.renderToString((await render(p)).Content);
    const tables = html.match(/<table[\s\S]*?<\/table>/g) ?? [];
    return {
    id: p.id,
    title: p.data.title,
    description: p.data.description,
    category: CATEGORIES[p.data.category],
    date: formatDate(p.data.date),
    tags: p.data.tags,
    thumb: p.data.stat ? await container.renderToString(Thumb, { props: { data: p.data, bare: true } }) : undefined,
    text: plain(html.replace(/<table[\s\S]*?<\/table>/g, ' ')),
    tables: plain(tables.join(' ')),
    };
  }));
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
