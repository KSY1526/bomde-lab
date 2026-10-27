import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 육각형 비교 페이지(/players/compare/)가 받아 쓰는 선수별 육각형(전 시즌 + 통산)과 이름·팀
const DIR = join(process.cwd(), 'src/data/players');
export function getStaticPaths() {
  const only = process.env.PLAYERS_ONLY?.split(',');
  return readdirSync(DIR).filter((f) => f.endsWith('.json') && (!only || only.includes(f.slice(0, -5)))).map((f) => ({ params: { id: f.slice(0, -5) } }));
}
export function GET({ params }: { params: { id: string } }) {
  const p = JSON.parse(readFileSync(join(DIR, `${params.id}.json`), 'utf8'));
  const hex = Object.fromEntries(Object.entries(p.hex as Record<string, any>).map(([k, h]) => [k, { q: h.q, n: h.n, vals: h.vals, type: h.type }]));
  return new Response(JSON.stringify({ id: p.id, name: p.name, kind: p.kind, team: p.team, pos: p.pos, hex }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
