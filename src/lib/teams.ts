// 글 썸네일 구단 색(2026-10-25 사용자 결정: 영상 선수 카드처럼 구단 색 판 + 실루엣, 옛 연한 남색 숫자판은 없앤다).
// 값은 영상과 같은 것(video/src/theme.ts TEAM, 한국어 위키백과 '틀:야구 주요 색'). c = 판 바탕, c2 = 아래 띠 위 줄
export const TEAM: Record<string, { c: string; c2: string }> = {
  KIA: { c: '#EA0029', c2: '#06141F' },
  삼성: { c: '#074CA1', c2: '#C0C0C0' },
  LG: { c: '#C40037', c2: '#000000' },
  두산: { c: '#1A1748', c2: '#EB1D25' },
  KT: { c: '#000000', c2: '#ED2024' },
  SSG: { c: '#CE0E2D', c2: '#FFB81C' },
  롯데: { c: '#041E42', c2: '#D00F31' },
  한화: { c: '#FC4E00', c2: '#07111F' },
  NC: { c: '#315288', c2: '#AF917B' },
  키움: { c: '#570514', c2: '#B07F4A' },
};
// 팀이 없는 글(지표 해설·리그 전체)
export const NEUTRAL = { c: '#3b4453', c2: '#8a93a3' };
export const teamColor = (t?: string) => (t && TEAM[t]) || NEUTRAL;

// 주색을 검정 쪽으로 k만큼(아래 띠 바탕)
export const darken = (hex: string, k = 0.55) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('');
