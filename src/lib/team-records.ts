import teams from '../data/teams.json';
import { SEASON } from './home';

// 팀 순위 페이지(/teams/, /teams/<시즌>/)와 "기록 기준일" 데이터. 원본은 scripts/export_teams.py가 만든 src/data/teams.json
export type TeamRow = {
  team: string; rank: number; g: number; w: number; l: number; d: number; pct: number; rs: number; ra: number; diff: number;
  pyth: number; luck: number; hr: number; sb: number; avg: number; obp: number; slg: number; ops: number; wrc: number;
  era: number; whip: number; k: number; bb: number;
};
const data = teams as unknown as Record<string, { until: string; teams: TeamRow[] }>;

export const TEAM_SEASONS = Object.keys(data).map(Number).sort((a, b) => b - a); // 최신순
export const seasonTeams = (season: number): TeamRow[] => data[String(season)]?.teams ?? [];

/** 최신 시즌 마지막 경기 날짜 '2026.10.12' — 선수·순위 페이지의 "기록 기준일" */
export const RECORD_DATE = (data[String(SEASON)]?.until ?? '').replace(/-/g, '.');
