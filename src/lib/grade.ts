// 등급 계산 한 곳(2026-11-07). 7단계 S+~C. 표본 적음·등급 없음은 데이터(export_players.py)의 판정을 따른다.
// 타자·선발은 WAR 기준: 6↑ S+, 4↑ S, 3↑ A+, 2↑ A, 1↑ B+, 0 초과 B, 그 밑 C.
// 구원투수(30이닝 이상, hex.gwpa 있음)는 WAR 기반 + WPA 보너스(사용자 2026-11-08). 단계 점수 = WAR 단계 + 보너스.
//   WAR 단계: C 0, B 1, B+ 2, A 3, A+ 4, S 5, S+ 6 (WAR<4면 1+WAR, 4 이상은 5+(WAR-4)/2). 점수의 내림이 등급.
//   보너스 = 0.6×WPA, 범위 -1 ~ +2.5단계. 마무리 고가치(WPA)를 반영하되 WPA 노이즈로 등급이 크게 뒤집히지 않게 제한한다.
//   (이전: WPA 단독 5↑ S+, 3.5↑ S, 2.5↑ A+, 1.5↑ A, 0.7↑ B+, 0 이상 B, 0 미만 C — 구원은 WAR이 낮아 WAR 단독은 상위 등급이 안 나온다.)
export type GradeHex = { grade: string | null; war: number | null; gwpa?: number | null };

export const gradeFromWar = (w: number) => (w >= 6 ? 'S+' : w >= 4 ? 'S' : w >= 3 ? 'A+' : w >= 2 ? 'A' : w >= 1 ? 'B+' : w > 0 ? 'B' : 'C');
const GRADES = ['C', 'B', 'B+', 'A', 'A+', 'S', 'S+'];
export const gradeFromRelief = (war: number, wpa: number) => {
  const base = war < 4 ? 1 + war : 5 + (war - 4) / 2;
  const bonus = Math.max(-1, Math.min(2.5, 0.6 * wpa));
  return GRADES[Math.max(0, Math.min(6, Math.floor(base + bonus)))];
};

/** 전체 등급(선수 페이지). 등급이 없으면 null, 표본 적음은 그대로 */
export function gradeOf(h: GradeHex | undefined): string | null {
  if (!h || !h.grade) return null;
  if (h.grade === '표본 적음') return h.grade;
  if (h.gwpa != null && h.war != null) return gradeFromRelief(h.war, h.gwpa);
  return h.war == null ? h.grade : gradeFromWar(h.war);
}

/** 목록류(검색 후보·홈·순위)에서 쓰는 글자: S+·S만, 나머지는 '' */
export function topGradeOf(h: GradeHex | undefined): string {
  const g = gradeOf(h);
  return g === 'S+' || g === 'S' ? g : '';
}
