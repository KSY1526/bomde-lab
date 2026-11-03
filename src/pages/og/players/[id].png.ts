// 선수 페이지 공유 썸네일: /og/players/<id>.png (요청 M, 2026-11-03)
// 빌드 시간 때문에 2026 시즌 육각형이 규정 충족(hex['2026'].q)인 선수만 만든다(2026-11-03 기준 112명).
// 2026 출전 전원(585명)은 한 장 2~5초라 배포가 10분 넘게 늘어 줄였다. 나머지 선수 페이지는 사이트 기본 OG(og/default.png).
// 이 조건을 바꾸면 src/pages/players/[id].astro의 image 줄도 같이 바꾼다
import type { APIContext } from 'astro';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ogPlayerPng, type PlayerOg } from '../../../lib/og';

type Hex = { q: boolean; vals: [string, number, string][]; type: string; grade: string | null; war: number | null };
const OG_YEAR = 2026;

// 선수 페이지와 같은 등급 계산(7단계). 그림에는 S+·S만 쓴다
const thin = (h?: Hex) => !h || !h.grade || h.grade === '표본 적음';
const grade = (h: Hex) => {
  if (thin(h) || h.war == null) return null;
  const w = h.war;
  return w >= 6 ? 'S+' : w >= 4 ? 'S' : w >= 3 ? 'A+' : w >= 2 ? 'A' : w >= 1 ? 'B+' : w > 0 ? 'B' : 'C';
};

export function getStaticPaths() {
  const dir = join(process.cwd(), 'src/data/players');
  const only = process.env.PLAYERS_ONLY?.split(',');
  return readdirSync(dir).filter((f) => f.endsWith('.json') && (!only || only.includes(f.slice(0, -5))))
    .map((f) => ({ id: f.slice(0, -5), file: join(dir, f) }))
    .filter(({ file }) => JSON.parse(readFileSync(file, 'utf8')).hex?.[OG_YEAR]?.q === true)
    .map(({ id, file }) => ({ params: { id }, props: { file } }));
}

export async function GET({ props }: APIContext) {
  const p = JSON.parse(readFileSync((props as { file: string }).file, 'utf8'));
  const word = p.kind === 'b' ? '타격' : '투구';
  // 최근 표본 충족 시즌(통산 제외, 선수 페이지와 같이 grade '표본 적음'이 아닌 시즌). 없으면 육각형 없이 마지막 시즌 유형만
  const years = (p.years as number[]).map(String).filter((y) => p.hex[y]);
  const qy = years.filter((y) => !thin(p.hex[y])).at(-1);
  const h: Hex | undefined = qy ? p.hex[qy] : p.hex[years.at(-1) ?? 'career'];
  const o: PlayerOg = {
    name: p.name, team: p.team, pos: p.pos, type: h?.type ?? '', grade: h ? grade(h) : null,
    hex: qy ? { head: `${qy} ${word} 육각형`, vals: h!.vals } : undefined,
  };
  const png = await ogPlayerPng(o);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
}
