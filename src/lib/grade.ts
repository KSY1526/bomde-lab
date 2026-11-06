// 등급 계산 한 곳(2026-11-07). 7단계 S+~C. 표본 적음·등급 없음은 데이터(export_players.py)의 판정을 따른다.
// 타자·선발은 WAR 기준: 6↑ S+, 4↑ S, 3↑ A+, 2↑ A, 1↑ B+, 0 초과 B, 그 밑 C.
// 구원투수(30이닝 이상)는 WPA 기준(hex.gwpa, scripts/export_patch.py grades): 5↑ S+, 3.5↑ S, 2.5↑ A+, 1.5↑ A, 0.7↑ B+, 0 이상 B, 0 미만 C (사용자 2026-11-07).
//   구원은 WAR로 보면 상위 등급이 거의 안 나와서(마무리 박영현도 B+) 따로 둔다. 선발보다 S 이상이 훨씬 드물게 잡았다.
export type GradeHex = { grade: string | null; war: number | null; gwpa?: number | null };

export const gradeFromWar = (w: number) => (w >= 6 ? 'S+' : w >= 4 ? 'S' : w >= 3 ? 'A+' : w >= 2 ? 'A' : w >= 1 ? 'B+' : w > 0 ? 'B' : 'C');
export const gradeFromWpa = (w: number) => (w >= 5 ? 'S+' : w >= 3.5 ? 'S' : w >= 2.5 ? 'A+' : w >= 1.5 ? 'A' : w >= 0.7 ? 'B+' : w >= 0 ? 'B' : 'C');

/** 전체 등급(선수 페이지). 등급이 없으면 null, 표본 적음은 그대로 */
export function gradeOf(h: GradeHex | undefined): string | null {
  if (!h || !h.grade) return null;
  if (h.grade === '표본 적음') return h.grade;
  if (h.gwpa != null) return gradeFromWpa(h.gwpa);
  return h.war == null ? h.grade : gradeFromWar(h.war);
}

/** 목록류(검색 후보·홈·순위)에서 쓰는 글자: S+·S만, 나머지는 '' */
export function topGradeOf(h: GradeHex | undefined): string {
  const g = gradeOf(h);
  return g === 'S+' || g === 'S' ? g : '';
}
