import index from '../data/player-index.json';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 선수검색 색인(scripts/export_players.py가 만듦). 선수 검색창(PlayerSearch.astro)이 처음 입력할 때 받아 브라우저 안에서 찾는다.
// 줄 = [id, 이름, b|p(타자·투수), 마지막 팀, 포지션, 첫 시즌, 마지막 시즌, 뛴 팀들, 등급]
// 등급(2026-11-03 사용자): 2026(없으면 마지막 시즌) 등급이 S+·S일 때만 그 글자, 아니면 ''. 목록류에서는 S+·S만 보인다.
// 등급 계산은 선수 페이지(players/[id].astro grade())와 같다: WAR 6 이상 S+, 4 이상 S. 표본 적음·등급 없음은 ''
type Hex = { grade: string | null; war: number | null };
export function topGrade(id: string): string {
  const f = join(process.cwd(), 'src/data/players', `${id}.json`);
  if (!existsSync(f)) return '';
  const p: { years: number[]; hex: Record<string, Hex> } = JSON.parse(readFileSync(f, 'utf8'));
  const key = p.hex['2026'] ? '2026' : p.years.map(String).filter((y) => p.hex[y]).at(-1);
  const h = key ? p.hex[key] : undefined;
  if (!h || !h.grade || h.grade === '표본 적음' || h.war == null) return '';
  return h.war >= 6 ? 'S+' : h.war >= 4 ? 'S' : '';
}

export function GET() {
  const rows = (index as unknown[][]).map((r) => [...r, topGrade(r[0] as string)]);
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
