export const SITE = {
  title: '봄데 연구소',
  tagline: '자이언츠 팬이 숫자로 보는 KBO',
  description: 'KBO 투구·기록 데이터를 가공한 통계와 차트로 읽는 야구 블로그. 크봇에게 기록을 물어보세요.',
};

// 쇼츠·릴스 채널. 푸터와 소개 페이지에 링크로 나온다.
export const SOCIAL = [
  { label: '유튜브', href: 'https://www.youtube.com/@bomde_lab' },
  { label: '인스타그램', href: 'https://www.instagram.com/bomde_lab/' },
];

// 메뉴 = 카테고리. 새 카테고리는 사용자가 정할 때 여기에 추가한다(content.config.ts enum도 같이).
export const CATEGORIES: Record<string, string> = {
  season: '시즌 분석',
};

/** base('/bomde-lab')를 붙인 내부 링크. url('posts/foo') → '/bomde-lab/posts/foo/' */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\/|\/$/g, '');
  return clean ? `${base}/${clean}/` : `${base}/`;
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
