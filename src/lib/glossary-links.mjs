// 글 본문에서 지표 이름이 처음 나올 때 지표 사전(/glossary/<id>/)으로 링크한다 (2026-10-18).
// 빌드가 끝난 뒤 dist/posts/*/index.html을 고친다. 글 파일(MDX)은 그대로라 발행 관문 stamp(본문 해시)도 그대로다.
// (Astro 7 기본 Markdown 처리기 Sätteri는 remark 플러그인을 돌리지 않아서 빌드 결과를 고치는 방식으로 했다)
// 본문(.prose)의 문단·목록 글자만 보고, 소제목·표·링크·코드 안은 건너뛴다.
// "피우르크" 속 "우르크", "피OPS" 속 "OPS"처럼 앞에 글자가 붙으면 다른 말이라 링크하지 않는다.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const GLOSSARY = new URL('../content/glossary/', import.meta.url);
const SKIP_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'code', 'pre', 'script', 'style', 'svg', 'button']);
const TEXT_TAGS = new Set(['p', 'li']);

function loadTerms() {
  const terms = [];
  for (const f of readdirSync(GLOSSARY).filter((f) => f.endsWith('.md'))) {
    const fm = readFileSync(new URL(f, GLOSSARY), 'utf8').split('---')[1] ?? '';
    const m = fm.match(/^match:\s*\[(.*)\]\s*$/m);
    if (!m) continue;
    const id = f.replace(/\.md$/, '');
    for (const w of [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])) terms.push({ id, w });
  }
  return terms.sort((a, b) => b.w.length - a.w.length); // 긴 표기 먼저(WAR* → WAR)
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 한 글의 HTML에서 본문 영역만 링크를 건다. 링크한 지표 id 목록과 새 HTML을 돌려준다 */
export function linkTerms(html, terms, base = '') {
  const start = html.indexOf('class="prose"');
  if (start < 0) return { html, linked: [] };
  const endTags = ['<footer class="tags', '</article>'].map((t) => html.indexOf(t, start)).filter((i) => i > 0);
  const end = Math.min(...endTags);
  const re = new RegExp(`(?<![가-힣A-Za-z0-9])(${terms.map((t) => esc(t.w)).join('|')})`, 'g');
  const idOf = new Map(terms.map((t) => [t.w, t.id]));
  const done = new Set();
  let textDepth = 0;
  let skipDepth = 0;
  const parts = html.slice(start, end).split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<(\/?)([a-zA-Z0-9]+)/);
      if (!m || p.endsWith('/>')) continue;
      const tag = m[2].toLowerCase();
      const d = m[1] ? -1 : 1;
      if (TEXT_TAGS.has(tag)) textDepth += d;
      if (SKIP_TAGS.has(tag)) skipDepth += d;
      continue;
    }
    if (textDepth <= 0 || skipDepth > 0 || !p) continue;
    parts[i] = p.replace(re, (w) => {
      const id = idOf.get(w);
      if (done.has(id)) return w;
      done.add(id);
      return `<a class="term-link" href="${base}/glossary/${id}/">${w}</a>`;
    });
  }
  return { html: html.slice(0, start) + parts.join('') + html.slice(end), linked: [...done] };
}

/** Astro 통합: 빌드 뒤 글 페이지에 지표 사전 링크 */
export function glossaryLinks({ base = '/' } = {}) {
  return {
    name: 'glossary-links',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const terms = loadTerms();
        const postsDir = join(fileURLToPath(dir), 'posts');
        if (!terms.length || !existsSync(postsDir)) return;
        let n = 0;
        for (const slug of readdirSync(postsDir)) {
          const f = join(postsDir, slug, 'index.html');
          if (!existsSync(f)) continue;
          const { html, linked } = linkTerms(readFileSync(f, 'utf8'), terms, base.replace(/\/$/, ''));
          if (linked.length) { writeFileSync(f, html); n += linked.length; }
        }
        logger.info(`지표 사전 링크 ${n}개`);
      },
    },
  };
}
