// 글 ↔ 선수 연결(2026-11-03, 요청 K). 글 frontmatter tags 중 선수 이름과 같은 것을 빌드 때 찾는다(하드코딩 없음).
// 동명이인은 글 날짜 연도에 뛴 선수만 남기고, 그래도 여럿이거나 0명이면 연결하지 않는다(heldBack에 남김).
import type { CollectionEntry } from 'astro:content';
import playerIndex from '../data/player-index.json';
import { publishedPosts } from './posts';

type Row = [string, string, string, string, string, number, number, string[]];
export type PostPlayer = { id: string; name: string };

const byName = new Map<string, Row[]>();
for (const r of playerIndex as unknown as Row[]) {
  if (!r[1]) continue;
  (byName.get(r[1]) ?? byName.set(r[1], []).get(r[1])!).push(r);
}

export function playersOfPost(post: CollectionEntry<'posts'>): { players: PostPlayer[]; held: string[] } {
  const year = new Date(post.data.date.getTime() + 9 * 3600 * 1000).getUTCFullYear();
  const players: PostPlayer[] = [];
  const held: string[] = [];
  // 감독 글: 감독 이름이 같은 이름의 선수로 잘못 연결된다(김태형 감독 ≠ 투수 김태형) → 연결하지 않는다
  if (post.data.tags.includes('감독')) return { players, held };
  for (const t of post.data.tags) {
    const c = byName.get(t);
    if (!c) continue;
    const ok = c.length === 1 ? c : c.filter((r) => r[5] <= year && year <= r[6]);
    if (ok.length === 1) { if (!players.some((q) => q.id === ok[0][0])) players.push({ id: ok[0][0], name: t }); }
    else held.push(`${t}(${c.map((r) => r[0]).join('·')})`);
  }
  return { players, held };
}

/** 선수 id → 그 선수를 다룬 글(최신순) */
export async function postsByPlayer(): Promise<Map<string, CollectionEntry<'posts'>[]>> {
  const m = new Map<string, CollectionEntry<'posts'>[]>();
  for (const post of await publishedPosts()) {
    for (const q of playersOfPost(post).players) (m.get(q.id) ?? m.set(q.id, []).get(q.id)!).push(post);
  }
  return m;
}
