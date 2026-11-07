/** 선수 실루엣(2026-11-07 사용자 확정): 타자는 레그킥 준비 자세, 투수는 작은 둥근 미트와 큰 스트라이드. 키·몸무게로 체격이 달라진다. */
export function silhouette(o: { pitcher?: boolean; height?: number; weight?: number; flip?: boolean; no?: string; numColor?: string; fill?: string }): string {
  const { pitcher = false, flip = false, no = '', numColor = '#080b10', fill = 'currentColor' } = o;
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const height = Number.isFinite(o.height) && o.height! > 0 ? clamp(o.height!, 145, 210) : 183;
  const weight = Number.isFinite(o.weight) && o.weight! > 0 ? o.weight! : 88;
  const bulk = clamp((weight / (height / 100) ** 2 - 20) / 14, 0, 1);
  // 발바닥은 고정. 좌표 길이만 변경하고 머리·장비는 각 부착점에서 원형 유지.
  const sy = clamp(height / 190, .79, 1.025);
  const Y = (y: number) => 256 + (y - 256) * sy;
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  type P = [number, number];
  const angular = false;
  const path = (d: string) => `<path d="${d}"/>`;
  const disc = (x: number, y: number, r: number) => path(angular
    ? `M${x-r} ${y-r*.5}L${x-r*.5} ${y-r}H${x+r*.5}L${x+r} ${y-r*.5}V${y+r*.5}L${x+r*.5} ${y+r}H${x-r*.5}L${x-r} ${y+r*.5}Z`
    : `M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`);
  const bone = (a: P, b: P, ra: number, rb: number) => {
    const ay=Y(a[1]), by=Y(b[1]), dx=b[0]-a[0], dy=by-ay;
    const len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len;
    return path(`M${a[0]+nx*ra} ${ay+ny*ra}L${b[0]+nx*rb} ${by+ny*rb}L${b[0]-nx*rb} ${by-ny*rb}L${a[0]-nx*ra} ${ay-ny*ra}Z`)
      +disc(a[0],ay,ra)+disc(b[0],by,rb);
  };
  const rigid = (p: P, d: string) => `<g transform="translate(${p[0]} ${Y(p[1])})">${path(d)}</g>`;
  // 시안마다 어깨·골반·팔꿈치·손·무릎·발목의 동작을 다르게 배치한다.
  const pose = pitcher ? { chest: [114, 85] as P, hip: [87, 155] as P, head: [119, 47] as P, elbows: [[44, 83], [160, 106]] as P[], hands: [[30, 37], [183, 91]] as P[], knees: [[60, 200], [143, 195]] as P[], ankles: [[30, 238], [171, 238]] as P[] } : { chest: [99, 65] as P, hip: [92, 139] as P, head: [96, 28] as P, elbows: [[64, 88], [115, 86]] as P[], hands: [[61, 52], [67, 57]] as P[], knees: [[71, 191], [140, 162]] as P[], ankles: [[67, 238], [137, 204]] as P[] };
  const { chest, hip, head, elbows, hands, knees, ankles } = pose;
  const shoulder=19+bulk*7, waist=17+bulk*13, thigh=12+bulk*7, arm=7+bulk*3;
  const left: P=[chest[0]-shoulder+4,chest[1]+5], right: P=[chest[0]+shoulder-4,chest[1]+5];
  let art='';
  // 배트: 끝은 굵고 손잡이는 가늘게. 몸통과 별개인 고정 폭 장비.
  if (!pitcher) art += bone([23, -5], hands[0], 6, 2.5)
    +disc(hands[0][0],Y(hands[0][1])+5,4);
  // 무릎바지 아래 좁은 스타킹, 밑창·스파이크의 돌출 윤곽.
  ankles.forEach((ankle: P,i: number) => {
    art += bone(knees[i],ankle,7.3+bulk*1.5,6.3+bulk);
    const shoeAnchor: P = [ankle[0], ankle[1] === 238 ? 256 - 18 / sy : ankle[1]];
    art += rigid(shoeAnchor, angular
      ? 'M-8 -3H8L12 6L24 10V15H16V18H11V15H-1V18H-6V15H-11V7Z'
      : 'M-8 -3Q0 -6 8 -2L11 5Q23 7 24 12L24 15H17V18H12V15H0V18H-6V15H-11Q-12 8 -8 -3Z');
    const root: P=[hip[0]+(i ? 9 : -9),hip[1]+20];
    const cuff: P=[knees[i][0],knees[i][1]-4];
    art += bone(root,cuff,thigh,9+bulk*3);
  });
  // 골반과 상의 사이 3px의 투명 벨트 선. 검은 덧칠 없이 팀 배경이 보인다.
  art += path(`M${hip[0]-waist} ${Y(hip[1]-1)}L${hip[0]+waist} ${Y(hip[1]-1)}L${hip[0]+waist-2} ${Y(hip[1]+15)}L${hip[0]-waist+2} ${Y(hip[1]+15)}Z`);
  art += angular
    ? path(`M${chest[0]-shoulder} ${Y(chest[1])}L${chest[0]+shoulder} ${Y(chest[1])}L${hip[0]+waist+2} ${Y(hip[1]-5)}L${hip[0]-waist-2} ${Y(hip[1]-5)}Z`)
    : path(`M${chest[0]-shoulder} ${Y(chest[1]+3)}Q${chest[0]} ${Y(chest[1]-10)} ${chest[0]+shoulder} ${Y(chest[1]+3)}Q${hip[0]+waist+5} ${Y(hip[1]-28)} ${hip[0]+waist} ${Y(hip[1]-5)}L${hip[0]-waist} ${Y(hip[1]-5)}Q${hip[0]-waist-4} ${Y(hip[1]-30)} ${chest[0]-shoulder} ${Y(chest[1]+3)}Z`);
  [left,right].forEach((s,i) => {
    art += bone(s,elbows[i],arm+3,arm) + bone(elbows[i],hands[i],arm-1,5.5);
  });
  art += bone([head[0],head[1]+22],[chest[0],chest[1]+6],7,8);
  // 얼굴 옆선과 뚜렷한 챙. 타자 헬멧은 귀덮개에 투명 구멍을 낸다.
  art += rigid(head, angular
    ? 'M-14 1L-9 -8H8L16 0V8L22 13L15 16L12 27H-2L-12 18Z'
    : 'M-14 4Q-15 -9 1 -9Q16 -9 17 7L22 12Q24 15 17 17L15 24Q10 30 -1 27L-12 19Z');
  if (pitcher) {
    art += rigid(head, angular ? 'M-16 4L-12 -10L4 -13L16 -6L18 3L30 7V11H8L-16 8Z'
      : 'M-16 6Q-19 -12 0 -13Q15 -14 18 3L29 6Q33 10 28 12L8 9Z');
    art += rigid(hands[1], 'M-4 8Q-9 5 -9 0Q-9 -4 -6 -3L-5 -7Q-3 -11 2 -10Q8 -10 9 -4Q11 3 5 8L0 10Z');
    // 공을 쥔 손의 작은 원형 윤곽.
    art += disc(hands[0][0],Y(hands[0][1])-4,5);
  } else {
    art += `<g transform="translate(${head[0]} ${Y(head[1])})"><path fill-rule="evenodd" d="${angular
      ? 'M-17 7L-15 -7L-5 -14H8L19 -4L20 5L31 8V13H8L2 30H-10L-17 21ZM-8 11V19H-3V11Z'
      : 'M-17 7Q-20 -14 1 -14Q19 -14 20 5L29 7Q35 12 29 14L8 11L3 27Q-5 34 -13 25L-17 17ZM-8 12Q-11 17 -7 20Q-2 21 -2 16Q-2 11 -8 12Z'}"/></g>`;
  }
  const digits: Record<string,string> = {'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111'};
  const chars=Array.from(no).filter(c=>digits[c]);
  const unit=Math.min(4.6,(waist*2-8)/Math.max(1,chars.length*4-1));
  // 투수는 기울어진 몸통 중심에 배치하되 숫자는 똑바로 유지한다.
  const nx=pitcher ? chest[0]*.4+hip[0]*.6 : chest[0]*.35+hip[0]*.65;
  const numberY=pitcher ? chest[1]*.4+hip[1]*.6-9 : hip[1]-36;
  const cells=chars.map((c,i)=>Array.from(digits[c]).map((on,j)=>on==='1'?`M${(i*4+j%3)*unit} ${Math.floor(j/3)*unit}h${unit}v${unit}h${-unit}Z`:'').join('')).join('');
  const number=cells?`<g fill="${esc(numColor)}" transform="translate(${(flip?210-nx:nx)-(chars.length*4-1)*unit/2} ${Y(numberY)})">${path(cells)}</g>`:'';
  return `<svg class="sil" viewBox="0 -24 210 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="${esc(fill)}"${flip?' transform="translate(210 0) scale(-1 1)"':''}>${art}</g>${number}</svg>`;
}
