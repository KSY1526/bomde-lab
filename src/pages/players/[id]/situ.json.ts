import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 선수 상황별 데이터(전 시즌). 선수 페이지에서 다른 시즌 버튼을 누를 때 받아 src/lib/situ.ts로 그린다. 기본 시즌은 페이지에 미리 그려져 있다
const DIR = join(process.cwd(), 'src/data/players-situ');
export function getStaticPaths() {
  const only = process.env.PLAYERS_ONLY?.split(',');
  return readdirSync(DIR).filter((f) => f.endsWith('.json') && (!only || only.includes(f.slice(0, -5)))).map((f) => ({ params: { id: f.slice(0, -5) } }));
}
export function GET({ params }: { params: { id: string } }) {
  return new Response(readFileSync(join(DIR, `${params.id}.json`)), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
