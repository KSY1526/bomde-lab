import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import playerIndex from '../data/player-index.json';

// 홈 "오늘의 선수"·"2026 WAR 순위" 데이터(요청 H, 2026-11-03 사용자: 홈은 C안 + B안 순위표). 빌드 때 계산한다.
// 표본 충족 = 선수 JSON hex[시즌].q (scripts/export_players.py 판정). 등급은 선수 페이지 grade()와 같은 WAR 기준(6↑ S+, 4↑ S).
// 목록류에서는 S+·S만 글자로 보인다(그 아래는 '').
export const SEASON = 2026;
const Y = String(SEASON);

type Hex = { q: boolean; n: number | null; vals: [string, number, string][]; type: string; grade: string | null; war: number | null };
type Row = { season: number; team: string; war: number };
type Player = { id: string; name: string; kind: 'b' | 'p'; team: string; pos: string; hand: string; hex: Record<string, Hex>; rows: Row[] };
type IRow = [string, string, string, string, string, number, number, string[]];

export type Ranked = {
  id: string; name: string; kind: 'b' | 'p'; team: string; pos: string;
  war: number; grade: string; type: string; vals: Hex['vals'];
  rank: string; pool: number;
};

export function topGradeOf(h: Hex | undefined): string {
  if (!h || !h.grade || h.grade === '표본 적음' || h.war == null) return '';
  return h.war >= 6 ? 'S+' : h.war >= 4 ? 'S' : '';
}

// 공동 순위(순위 페이지 src/lib/rankings.ts도 같이 쓴다). 값이 클수록 위. 순위 = 자기보다 큰 값 수 + 1, 같은 값이 둘 이상이면 "공동 k"
export function tieRanks(vals: number[]): string[] {
  return vals.map((v) => {
    const rk = 1 + vals.filter((o) => o > v).length;
    return vals.filter((o) => o === v).length > 1 ? `공동 ${rk}` : String(rk);
  });
}

let cache: { b: Ranked[]; p: Ranked[] } | null = null;

// 시즌에 뛴 선수 중 표본 충족 선수를 타자·투수로 나눠 WAR 내림차순. 순위는 "자기보다 WAR 높은 사람 수 + 1", 동률이면 "공동 k"
export function qualified(): { b: Ranked[]; p: Ranked[] } {
  if (cache) return cache;
  const out: { b: Ranked[]; p: Ranked[] } = { b: [], p: [] };
  for (const r of playerIndex as IRow[]) {
    if (r[6] !== SEASON) continue;
    const p: Player = JSON.parse(readFileSync(join(process.cwd(), 'src/data/players', `${r[0]}.json`), 'utf8'));
    const h = p.hex[Y];
    if (!h || !h.q || h.war == null) continue;
    const row = p.rows.filter((x) => x.season === SEASON).at(-1);
    if (!row) continue;
    out[p.kind].push({ id: p.id, name: p.name, kind: p.kind, team: row.team, pos: p.pos, war: h.war, grade: topGradeOf(h), type: h.type, vals: h.vals, rank: '', pool: 0 });
  }
  for (const k of ['b', 'p'] as const) {
    const pool = out[k].sort((a, b) => b.war - a.war);
    const ranks = tieRanks(pool.map((x) => x.war));
    pool.forEach((x, i) => { x.rank = ranks[i]; x.pool = pool.length; });
  }
  cache = out;
  return out;
}

// 오늘의 선수 후보: 표본 충족 + 등급 S+·S. WAR 높은 순(첫 후보 = JS 꺼졌을 때 보이는 선수)
export function todayCandidates(): Ranked[] {
  const { b, p } = qualified();
  return [...b, ...p].filter((x) => x.grade).sort((a, c) => c.war - a.war);
}

// 이름이 태그에 있는 글(최신순). 같은 시즌에 같은 이름 선수가 여럿이면 팀 태그도 있어야 한다
export function nameIsAmbiguous(name: string): boolean {
  return (playerIndex as IRow[]).filter((r) => r[1] === name && r[6] === SEASON).length > 1;
}
