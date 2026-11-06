export const SITE = {
  title: '봄데 연구소',
  tagline: 'KBO 선수 기록 검색과 숫자로 읽는 칼럼',
  description: 'KBO 투구·기록 데이터를 가공한 통계와 차트로 읽는 야구 블로그. 크봇에게 기록을 물어보세요.',
};

// 쇼츠·릴스 채널. 푸터와 소개 페이지에 링크로 나온다.
export const SOCIAL = [
  { key: 'youtube', label: '유튜브', href: 'https://www.youtube.com/@bomde_lab' },
  { key: 'instagram', label: '인스타그램', href: 'https://www.instagram.com/bomde_lab/' },
];

// 메뉴 = 카테고리. 새 카테고리는 사용자가 정할 때 여기에 추가한다(content.config.ts enum도 같이).
export const CATEGORIES: Record<string, string> = {
  metrics: '야구 지표 해설', // 2026-11-06 사용자: 지표 해설을 다른 분석보다 앞에
  season: '시즌 분석',
  player: '선수 분석',
  game: '경기 분석',
  deep: '심층 분석',
};

// 머리말 메뉴(2026-11-03 사용자: 대분류 홈·선수 검색·칼럼·소개, 소분류는 그 구역 페이지에서 두 번째 줄로).
// 경로는 base 없이(url()에 넣는다). 구역은 sectionOf()로 정한다: 선수 개인 페이지는 선수 검색, 글 페이지는 칼럼.
export type Section = 'home' | 'players' | 'columns' | 'about';
export const MENU: { key: Section; label: string; path: string }[] = [
  { key: 'home', label: '홈', path: '' },
  { key: 'players', label: '선수 검색', path: 'players' },
  { key: 'columns', label: '칼럼', path: 'columns' },
  { key: 'about', label: '소개', path: 'about' },
];
export const SUBMENU: Partial<Record<Section, { label: string; path: string }[]>> = {
  players: [
    { label: '선수 검색', path: 'players' },
    { label: '선수 순위', path: 'rankings' },
    { label: '팀 순위', path: 'teams' },
    { label: '선수 비교', path: 'players/compare' },
  ],
  columns: [
    { label: '전체', path: 'columns' },
    ...Object.entries(CATEGORIES).map(([key, label]) => ({ label, path: `category/${key}` })),
  ],
};

// 구역별 검색(2026-11-03 사용자): 홈·구역 없는 페이지 = 통합, 선수 검색 구역 = 선수만, 칼럼 구역 = 글만. PlayerSearch mode·머리말 Search가 쓴다
export type SearchMode = 'all' | 'players' | 'posts';
export const SEARCH_PLACEHOLDER: Record<SearchMode, string> = { all: '선수 이름 or 글 검색', players: '선수 이름', posts: '글 검색' };

/** 주소(base 포함 pathname)로 구역. 소개·검색 결과·404 같은 구역 없는 페이지는 null */
export function sectionOf(pathname: string): Section | null {
  const is = (p: string) => pathname === url(p) || pathname.startsWith(url(p));
  if (pathname === url()) return 'home';
  if (is('players') || is('rankings') || is('teams')) return 'players';
  if (is('columns') || is('category') || is('posts')) return 'columns';
  if (is('about')) return 'about';
  return null;
}

// 카테고리 페이지 맨 위 한 줄 설명(사용자 결정 2026-10-18). 처음 온 사람이 고르기 쉽게, 검색 설명(meta description)으로도 쓴다
export const CATEGORY_DESC: Record<string, string> = {
  season: '한 시즌 동안 팀과 리그가 어떻게 흘러갔는지 숫자로 짚어 봅니다',
  player: '한 선수의 성적이 왜 그렇게 나왔는지 투구·타격 데이터로 들여다봅니다',
  game: '포스트시즌 경기마다 승부를 가른 장면을 승리확률로 되짚습니다',
  deep: '리그 전체에 걸친 흐름과 기록의 한계를 깊게 파고듭니다',
  metrics: '우르크, WPA처럼 어려운 기록을 하나씩 풀어 보는 연재입니다',
};

/** base를 붙인 내부 링크. url('posts/foo') → '/posts/foo/' (2026-10-18 개인 도메인으로 옮기며 base '/bomde-lab' → '/') */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\/|\/$/g, '');
  return clean ? `${base}/${clean}/` : `${base}/`;
}

/** 한국 날짜로 표시. 빌드 서버(GitHub Actions)는 UTC라서 date에 시각을 넣은 글(같은 날 여러 편, 2026-10-18~)이 하루 밀리지 않게 +9시간 */
export function formatDate(d: Date): string {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCFullYear()}.${String(k.getUTCMonth() + 1).padStart(2, '0')}.${String(k.getUTCDate()).padStart(2, '0')}`;
}

/** 썸네일 주소 끝에 붙일 짧은 버전. 내용(대표 숫자)이 바뀌면 주소가 바뀌어 브라우저·SNS가 옛 그림을 캐시로 보여 주지 않는다 (2026-10-18) */
export function imgVersion(v: unknown): string {
  let h = 5381;
  for (const c of JSON.stringify(v ?? '')) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
