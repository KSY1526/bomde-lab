import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import playerIndex from '../data/player-index.json';
import { SEASON, topGradeOf, tieRanks } from './home';

// 순위 페이지(/rankings/, /rankings/<시즌>/, 요청 L 2026-11-03). 홈 WAR 순위와 같은 기준:
// 대상 = 선수 JSON hex[시즌].q(표본 충족)이고 WAR가 있는 선수, 등급 글자는 S+·S만(topGradeOf).
// 지표는 선수 JSON rows(시즌 기록)에 실제 있는 값만 쓴다. 새로 계산하지 않는다.
export const FIRST_SEASON = 2010;
export const SEASONS = Array.from({ length: SEASON - FIRST_SEASON + 1 }, (_, i) => SEASON - i); // 최신순

type Hex = { q: boolean; war: number | null; grade: string | null; vals: [string, number, string][]; type: string };
type Row = Record<string, string | number | null> & { season: number; team: string };
type Player = { id: string; name: string; kind: 'b' | 'p'; pos: string; hex: Record<string, Hex>; rows: Row[] };
type IRow = [string, string, string, string, string, number, number, string[]];

/** 열 정의. key = rows 필드, low = 낮을수록 좋은 기록(첫 정렬이 오름차순), fmt = 표시 */
export type Col = { key: string; label: string; title: string; low?: boolean; fmt: (v: number | string) => string };
const f = (d: number) => (v: number | string) => Number(v).toFixed(d);
const rate = (v: number | string) => Number(v).toFixed(3).replace(/^0/, ''); // .283, 1.012
const pct = (v: number | string) => `${Number(v).toFixed(1)}%`;
const int = (v: number | string) => String(v);
const sgn = (v: number | string) => (Number(v) > 0 ? '+' : '') + Number(v).toFixed(2);

export const COLS: Record<'b' | 'p', Col[]> = {
  b: [
    { key: 'war', label: 'WAR', title: '대체 선수 대비 승리 기여', fmt: f(2) },
    { key: 'wrc', label: 'wRC+', title: '조정 득점 창출력(리그 평균 100)', fmt: f(0) },
    { key: 'avg', label: '타율', title: '타율', fmt: rate },
    { key: 'obp', label: '출루율', title: '출루율', fmt: rate },
    { key: 'slg', label: '장타율', title: '장타율', fmt: rate },
    { key: 'ops', label: 'OPS', title: '출루율 + 장타율', fmt: rate },
    { key: 'wpa', label: 'WPA', title: '승리확률 기여(상황별 승리확률 변화의 합)', fmt: sgn },
    { key: 'hr', label: '홈런', title: '홈런', fmt: int },
    { key: 'sb', label: '도루', title: '도루', fmt: int },
    { key: 'pa', label: '타석', title: '타석', fmt: int },
  ],
  p: [
    { key: 'war', label: 'WAR', title: '대체 선수 대비 승리 기여', fmt: f(2) },
    { key: 'era', label: 'ERA', title: '평균자책점', low: true, fmt: f(2) },
    { key: 'fip', label: 'FIP', title: '수비 무관 평균자책점', low: true, fmt: f(2) },
    { key: 'whip', label: 'WHIP', title: '이닝당 출루 허용', low: true, fmt: f(2) },
    { key: 'k', label: 'K%', title: '탈삼진률', fmt: pct },
    { key: 'bb', label: 'BB%', title: '볼넷률', low: true, fmt: pct },
    { key: 'wpa', label: 'WPA', title: '승리확률 기여(상황별 승리확률 변화의 합)', fmt: sgn },
    { key: 'ip', label: '이닝', title: '이닝', fmt: int },
    { key: 'w', label: '승', title: '승', fmt: int },
    { key: 'sv', label: '세이브', title: '세이브', fmt: int },
    { key: 'hld', label: '홀드', title: '홀드', fmt: int },
  ],
};

/** 한 칸: 정렬값 s(없으면 null), 표시 t */
export type Cell = { s: number | null; t: string };
/** q = 규정 충족, ratio = 규정 대비 비율(타석 또는 아웃), rel = 구원투수 30이닝 이상(불펜 보기) */
export type RankRow = { id: string; name: string; team: string; grade: string; rank: string; cells: Cell[]; q: boolean; ratio: number; rel: boolean };

// 이닝 '131.1' → 정렬용 아웃 수(131*3+1)
const ipOuts = (v: string | number) => { const [a, b = '0'] = String(v).split('.'); return Number(a) * 3 + Number(b); };

const files = new Map<string, Player>();
function load(id: string): Player {
  let p = files.get(id);
  if (!p) {
    p = JSON.parse(readFileSync(join(process.cwd(), 'src/data/players', `${id}.json`), 'utf8')) as Player;
    files.set(id, p);
  }
  return p;
}

const cache = new Map<number, { b: RankRow[]; p: RankRow[] }>();

/** 시즌 타자·투수 전원(WAR 있는 선수), WAR 내림차순. 처음 보이는 건 규정 충족뿐이고(q), 순위는 규정 충족끼리 매긴다(홈 qualified()와 같은 규칙).
 *  규정 대비 비율의 기준(규정타석·규정이닝)은 그 시즌 규정 충족 선수 중 가장 적게 뛴 사람의 타석·아웃 수로 잡는다. 70%·50%·전부·불펜 보기는 화면 스크립트가 거른다 */
export function seasonRankings(season: number): { b: RankRow[]; p: RankRow[] } {
  const hit = cache.get(season);
  if (hit) return hit;
  const y = String(season);
  type Raw = RankRow & { war: number; vol: number };
  const raw: Record<'b' | 'p', Raw[]> = { b: [], p: [] };
  for (const r of playerIndex as IRow[]) {
    if (r[5] > season || r[6] < season) continue;
    const p = load(r[0]);
    const h = p.hex[y];
    if (!h || h.war == null) continue;
    const row = p.rows.filter((x) => x.season === season).at(-1);
    if (!row) continue;
    const cells = COLS[p.kind].map((c): Cell => {
      const v = row[c.key];
      if (v == null || v === '') return { s: null, t: '' };
      return { s: c.key === 'ip' ? ipOuts(v) : Number(v), t: c.fmt(v) };
    });
    const vol = p.kind === 'b' ? Number(row.pa ?? 0) : ipOuts(row.ip ?? 0);
    if (!vol) continue;
    const rel = p.kind === 'p' && Number(row.gs) * 2 < Number(row.g) && vol >= 90;
    raw[p.kind].push({ id: p.id, name: p.name, team: row.team, grade: topGradeOf(h as never), rank: '', cells, q: !!h.q, ratio: 0, rel, war: h.war, vol });
  }
  const out = { b: [] as RankRow[], p: [] as RankRow[] };
  for (const k of ['b', 'p'] as const) {
    const pool = raw[k].sort((a, b) => b.war - a.war || a.name.localeCompare(b.name, 'ko'));
    const thr = Math.min(...pool.filter((x) => x.q).map((x) => x.vol), Infinity);
    const qs = pool.filter((x) => x.q);
    const ranks = tieRanks(qs.map((x) => x.war));
    let qi = 0;
    out[k] = pool.map(({ war: _w, vol, ...x }) => ({ ...x, ratio: thr === Infinity ? 0 : Math.round((vol / thr) * 1000) / 1000, rank: x.q ? ranks[qi++] : '' }));
  }
  cache.set(season, out);
  return out;
}
