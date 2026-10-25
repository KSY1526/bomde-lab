// 글 검색(브라우저 안). 헤더 검색 창(Search.astro)과 검색 결과 페이지(pages/search.astro)가 같이 쓴다.
// 색인 = /search.json(pages/search.json.ts). 결과 줄 모양(CSS)은 Search.astro의 .search-results
export type Item = { thumb?: string; id: string; title: string; description: string; category: string; date: string; tags: string[]; text: string; tables: string };
type Row = { it: Item; hit: number; score: number; first: number };

export const ev = (name: string, detail?: string) =>
  (window as unknown as { bomdeEvent?: (n: string, d?: string) => void }).bomdeEvent?.(name, detail);

let index: Item[] | null = null;
let loading: Promise<Item[] | null> | null = null;
export function load(src: string) {
  loading ??= fetch(src)
    .then((r) => r.json())
    .then((j: Item[]) => (index = j))
    .catch(() => { loading = null; return null; });
  return loading;
}
export const loaded = () => index !== null;

// 한국어 조사·어미를 떼고 2자 이상만 검색어로("김도영이" → "김도영", "왜"는 버림)
const JOSA = /(으로|에서|에게|까지|부터|이랑|하고|이야|이에요|은|는|이|가|을|를|의|에|도|로|와|과|랑|야)$/;
function terms(q: string): string[] {
  return [...new Set(q.toLowerCase().split(/[\s,.?!]+/)
    .map((w) => (w.length >= 3 ? w.replace(JOSA, '') : w))
    .filter((w) => w.length >= 2))];
}

// 점수: 제목 10 · 태그 6 · 요약 4 · 본문 1(+등장 횟수, 최대 3) · 표 1. 맞은 검색어 수를 먼저 보고,
// 검색어를 모두 담은 글이 있으면 그 글만 보여 준다("김도영 만루포"에 김도영만 나온 글이 줄줄이 붙지 않게)
export function search(q: string, limit = 8): Row[] {
  const ts = terms(q);
  if (!index || ts.length === 0) return [];
  const rows = index
    .map((it) => {
      const title = it.title.toLowerCase(), desc = it.description.toLowerCase(), text = it.text.toLowerCase();
      const tags = it.tags.join(' ').toLowerCase(), tables = it.tables.toLowerCase();
      let hit = 0, score = 0, first = -1;
      for (const t of ts) {
        let s = 0;
        if (title.includes(t)) s += 10;
        if (tags.includes(t)) s += 6;
        if (desc.includes(t)) s += 4;
        const at = text.indexOf(t);
        if (at >= 0) {
          s += 1 + Math.min(text.split(t).length - 2, 3);
          if (first < 0) first = at;
        } else if (tables.includes(t)) s += 1;
        if (s > 0) { hit++; score += s; }
      }
      return { it, hit, score, first };
    })
    .filter((r) => r.hit > 0)
    .sort((a, b) => b.hit - a.hit || b.score - a.score);
  const all = rows.filter((r) => r.hit === ts.length);
  return (all.length ? all : rows).slice(0, limit);
}

function snippet(text: string, at: number) {
  if (at < 0) return '';
  const s = Math.max(0, at - 30);
  return (s > 0 ? '…' : '') + text.slice(s, s + 90).trim() + (s + 90 < text.length ? '…' : '');
}

// 결과 줄: 왼쪽 썸네일(글 목록과 같은 Thumb, 빌드 때 그린 HTML) + 카테고리·날짜 + 제목 + 본문 미리보기
export function renderRows(list: HTMLElement, rows: Row[], q: string, base: string) {
  list.replaceChildren();
  for (const { it, first } of rows) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `${base}posts/${it.id}/`;
    a.addEventListener('click', () => ev('search_click', `${it.id} | ${q}`.slice(0, 100)));
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${it.category} · ${it.date}`;
    const title = document.createElement('strong');
    title.textContent = it.title;
    const sn = document.createElement('span');
    sn.className = 'snip';
    sn.textContent = snippet(it.text, first) || it.description;
    const text = document.createElement('span');
    text.className = 'text';
    text.append(meta, title, sn);
    if (it.thumb) a.insertAdjacentHTML('beforeend', it.thumb); // 우리 빌드가 만든 HTML(search.json.ts)
    else a.classList.add('plain');
    a.append(text);
    li.append(a);
    list.append(li);
  }
}

export const searchUrl = (base: string, q: string) => `${base}search/?q=${encodeURIComponent(q)}`;

// 검색어를 크봇에게 넘긴다(ChatPanel이 창을 열고 입력 칸에 채운다. 보내기는 사용자가 누름, 2026-10-26)
export function askKbot(q: string) {
  ev('search_kbot', q.slice(0, 100));
  window.dispatchEvent(new CustomEvent('kbot:ask', { detail: q }));
}
