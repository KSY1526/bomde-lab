import { silhouette } from './silhouette';

// 선수 페이지 상황별 탭(설계 docs/블로그/선수검색-설계.md 5절). 목업 gen4.py·release_mock.py의 그림을 옮긴 것.
// HTML 문자열을 돌려주는 함수라서 빌드 때(기본 시즌, set:html)와 브라우저에서(다른 시즌 버튼, situ.json을 받아) 똑같이 쓴다.
// 데이터 = scripts/export_players.py situ() → src/data/players-situ/<id>.json {시즌: 묶음}. 스타일 src/styles/situ.css

type ZoneCell = [number, number | null]; // 존 9분할 한 칸: 타석, OPS
type Split = [number, number | null, number | null, number | null, number | null, number | null, number | null]; // 타석, 타율, 출루, 장타, OPS, 삼진%, 볼넷%
export type SituB = { sp?: Record<string, Split>; pt?: [string, number, number | null, number | null][]; spray?: Record<string, [number, number, number]>; lgc: Record<string, number>; side?: 'L' | 'R'; zone?: ZoneCell[]; lgz?: (number | null)[]; zoneS?: Record<string, ZoneCell[]>; lgzS?: Record<string, (number | null)[]>; zout?: ZoneCell[]; lgo?: (number | null)[]; zoutS?: Record<string, ZoneCell[]>; lgoS?: Record<string, (number | null)[]> };
type Ars = [string, number, number, number, number, number, number | null, number | null, number][]; // 구종, 비율, 구속, 헛스윙, 움직임 좌우·상하, 구종가치, 피OPS, 타석
export type SituP = {
  sp?: Record<string, Split>; ars?: Ars; arsS?: Record<string, Ars>;
  rel?: [number, number, number]; throws: 'L' | 'R'; lgm: Record<string, [number, number]>; lgslot?: string; lgr?: [number, number]; lgc: Record<string, number>; zone?: ZoneCell[]; lgz?: (number | null)[]; zoneS?: Record<string, ZoneCell[]>; lgzS?: Record<string, (number | null)[]>;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const f3 = (x: number | null | undefined) => (x == null ? '-' : Math.abs(x) < 1 ? x.toFixed(3).replace(/^(-?)0/, '$1') : x.toFixed(3));
const n0 = (x: number) => x.toFixed(0);

// 실루엣(Silhouette.astro와 같은 모양, 체격 기본값). 색은 currentColor
function sil(pitcher: boolean, flip: boolean): string {
  return silhouette({ pitcher, flip, fill: 'currentColor' });
}

// yr = 시즌 고르기 자리(구종·존·카운트 제목 옆). [id].astro가 시즌 선택 칸을 채우고, 어느 쪽을 바꿔도 상황별 전체가 바뀐다
const h2 = (t: string, small = '', yr = false) => `<h2>${t}${small ? `<small>${small}</small>` : ''}${yr ? '<span class="yrslot"></span>' : ''}</h2>`;

// 좌우 두 칸: 상대 실루엣 + 큰 OPS + 한 줄 기록. 타자 화면엔 상대 투수, 투수 화면엔 상대 타자
function hands(sp: Record<string, Split>, who: [string, string, boolean][], bat: boolean): string {
  return who.filter(([k]) => sp[k]).map(([k, lab, flip]) => {
    const [pa, avg, obp, slg, ops, so, bb] = sp[k];
    return `<div class="hand${pa < 20 ? ' thin' : ''}"><div class="hsil">${sil(bat, flip)}</div><div><div class="hlab">${lab}</div>
<div class="hops"><b>${f3(ops)}</b><span>${bat ? 'OPS' : '피OPS'}</span></div>
<div class="hrow"><span>타석 <b>${pa}</b></span><span>타율 <b>${f3(avg)}</b></span><span>출루 <b>${f3(obp)}</b></span><span>장타 <b>${f3(slg)}</b></span><span>삼진 <b>${so?.toFixed(1) ?? '-'}%</b></span><span>볼넷 <b>${bb?.toFixed(1) ?? '-'}%</b></span></div>${pa < 20 ? '<div class="hrow">20타석 미만 · 표본 적음</div>' : ''}</div></div>`;
  }).join('');
}

function gap(aLab: string, a: number | null, bLab: string, b: number | null, goodHigh: boolean): string {
  if (a == null || b == null) return '';
  const d = a - b, w = Math.min(50, (Math.abs(d) / 0.4) * 50), better = (d > 0) === goodHigh;
  return `<div class="gap"><span>${aLab}</span><div class="track"><i class="${d > 0 ? 'l' : 'r'} ${better ? 'pos' : 'neg'}" style="width:${w.toFixed(0)}%"></i><em></em></div><span>${bLab}</span></div>
<p class="gapcap">${goodHigh ? 'OPS' : '피OPS'} 차이 <b>${f3(Math.abs(d))}</b> (${better ? aLab : bLab} 상대 성적이 더 좋음)</p>`;
}

function rvBar(v: number | null, scale = 2): string {
  if (v == null) return '-';
  const w = Math.min(50, (Math.abs(v) / scale) * 50);
  return `<div class="rv"><i class="${v > 0 ? 'r pos' : 'l neg'}" style="width:${w.toFixed(0)}%"></i><em></em></div><span class="rvn">${v > 0 ? '+' : ''}${v.toFixed(2)}</span>`;
}
const rvHead = () => '<th>구종가치</th>';

// 카운트 판: 칸 색 = 리그 같은 카운트 대비 차이(0.5 OPS에서 최대), 20타석 미만 빗금
function countGrid(sp: Record<string, Split>, lg: Record<string, number>, goodHigh: boolean): string {
  let cells = '';
  for (let s = 0; s < 3; s++) for (let b = 0; b < 4; b++) {
    const k = `${b}-${s}`, row = sp[k], pa = row?.[0] ?? 0, ops = row?.[4] ?? null, L = lg[k];
    if (ops == null || !pa) { cells += `<div class="cc thin"><em>${k}</em><b>-</b><span>${pa}타석${pa ? ' · 타수 없음' : ''}</span></div>`; continue; }
    const d = ops - L, good = (d > 0) === goodHigh, a = Math.min(1, Math.abs(d) / 0.5);
    cells += `<div class="cc${pa < 20 ? ' thin' : ''}${a > 0.5 ? ' dk' : ''}" style="background:color-mix(in srgb, var(${good ? '--pos' : '--neg'}) ${Math.round(a * 85)}%, var(--surface))"><em>${k}</em><b>${f3(ops)}</b><span>${pa}타석 · 리그 ${f3(L)}</span></div>`;
  }
  return `<div class="cgrid-wrap"><div class="cg-y">스트라이크</div><div class="cg-s"><span>0</span><span>1</span><span>2</span></div><div><div class="cg-x"><span>볼 0</span><span>1</span><span>2</span><span>3</span></div>
<div class="cgrid">${cells}</div></div></div>
${legend(goodHigh, 20, `<span class="zn">칸 숫자 = ${goodHigh ? 'OPS' : '피OPS'} · 칸 이름 = 볼-스트라이크</span>`)}`;
}
const legend = (goodHigh: boolean, n: number, note = '') => `<div class="clegend"><span class="sw neg"></span>${goodHigh ? '리그보다 약함' : '리그보다 많이 맞음'}<span class="sw mid"></span>리그 수준<span class="sw pos"></span>${goodHigh ? '리그보다 강함' : '리그보다 잘 막음'}<span class="sw thinsw"></span>${n}타석 미만(표본 적음)${note}</div>`;

// 존 9분할 + 바깥 8칸: 스트라이크존을 가로·세로 3등분, 칸 색 = 리그 같은 칸 대비 차이(0.5 OPS에서 최대), 10타석 미만 빗금. 포수 시점
// 바깥 8칸(위·아래·왼·오른·네 모서리)은 존 밖에서 끝난 타석. o·lo는 9칸 배열(위·가운데·아래 × 왼·가운데·오른), 가운데(4번)는 비어 있음
function zcell([pa, ops]: ZoneCell, L: number | null | undefined, goodHigh: boolean, cls = ''): string {
  if (ops == null || !pa || L == null) return `<div class="zc ${cls} thin"><b>-</b><span>${pa}타석</span></div>`;
  const d = ops - L, good = (d > 0) === goodHigh, a = Math.min(1, Math.abs(d) / 0.5);
  return `<div class="zc ${cls}${pa < 10 ? ' thin' : ''}${a > 0.5 ? ' dk' : ''}" style="background:color-mix(in srgb, var(${good ? '--pos' : '--neg'}) ${Math.round(a * 85)}%, var(--surface))"><b>${f3(ops)}</b><span>${pa}타석</span><em>리그 ${f3(L)}</em></div>`;
}
function zoneGrid(z: ZoneCell[], lg: (number | null)[], goodHigh: boolean, o?: ZoneCell[], lo?: (number | null)[]): string {
  const inner = `<div class="zgrid">${z.map((c, i) => zcell(c, lg[i], goodHigh)).join('')}</div>`;
  const head = '<div class="zside"><span>← 3루 쪽</span><span>포수 시점</span><span>1루 쪽 →</span></div>';
  const note = `<span class="zn">칸 숫자 = ${goodHigh ? 'OPS' : '피OPS'} · 굵은 선 안 = 스트라이크존${o ? ', 바깥 = 존 밖' : ' (존 안에서 끝난 타석만)'}</span>`;
  if (!o || !lo) return `<div class="zwrap">${head}<div class="zin">${inner}</div></div>${legend(goodHigh, 10, note)}`;
  const out = (i: number, nm: string) => `<div class="zo zo-${nm}">${zcell(o[i], lo[i], goodHigh, 'sm')}</div>`;
  return `<div class="zwrap">${head}<div class="zfull">${out(0, 'tl')}${out(1, 't')}${out(2, 'tr')}${out(3, 'l')}<div class="zin">${inner}</div>${out(5, 'r')}${out(6, 'bl')}${out(7, 'b')}${out(8, 'br')}</div></div>${legend(goodHigh, 10, note)}`;
}
const hasZone = (e: { zone?: ZoneCell[]; lgz?: (number | null)[] }) => !!e.zone && !!e.lgz && e.zone.some((c) => c[0] >= 5);

// 존 9분할 + 전체·손별 탭(구종 표와 같은 모양). 탭 전환은 [id].astro가 같은 묶음(.sgrp) 안에서만
type ZoneSrc = { zout?: ZoneCell[]; lgo?: (number | null)[]; zoutS?: Record<string, ZoneCell[]>; lgoS?: Record<string, (number | null)[]>; zone?: ZoneCell[]; lgz?: (number | null)[]; zoneS?: Record<string, ZoneCell[]>; lgzS?: Record<string, (number | null)[]>; zout?: ZoneCell[]; lgo?: (number | null)[]; zoutS?: Record<string, ZoneCell[]>; lgoS?: Record<string, (number | null)[]> };
function zoneSection(e: ZoneSrc, hands: [string, string, string][], title: string, small: string, goodHigh: boolean): string {
  if (!hasZone(e)) return '';
  const sets = hands.map(([k, lab, h]) => [k, lab, h ? e.zoneS?.[h] : e.zone, h ? e.lgzS?.[h] : e.lgz, h ? e.zoutS?.[h] : e.zout, h ? e.lgoS?.[h] : e.lgo] as const)
    .filter(([, , z, l]) => z && l && z.some((c) => c[0] >= 5));
  const tabs = sets.length > 1 ? `<div class="sidebar" role="group" aria-label="상대 고르기">${sets.map(([k, lab], i) => `<button type="button" data-side="${k}" aria-pressed="${i === 0}">${lab}</button>`).join('')}</div>` : '';
  return h2(title, small, true) + `<div class="sgrp">${tabs}${sets.map(([k, , z, l, o, lo], i) => `<div data-side-body="${k}"${i ? ' hidden' : ''}>${zoneGrid(z!, l!, goodHigh, o, lo)}</div>`).join('')}</div>`;
}

function diamonds(sp: Record<string, Split>): string {
  const on: Record<string, number[]> = { '주자 없음': [0, 0, 0], '주자 있음': [1, 0, 0], 득점권: [0, 1, 0], 만루: [1, 1, 1] };
  const base = (x: number, y: number, f: number) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})" class="${f ? 'bf' : 'be'}"/>`;
  const cells = Object.keys(on).filter((k) => sp[k]).map((k) => {
    const [b1, b2, b3] = on[k], pa = sp[k][0];
    return `<div class="dcell${pa < 20 ? ' thin' : ''}"><svg viewBox="0 0 100 70" class="dia" aria-hidden="true">${base(80, 40, b1)}${base(50, 12, b2)}${base(20, 40, b3)}<path d="M44 62 L56 62 L56 56 L50 51 L44 56 Z" class="be"/></svg><b>${f3(sp[k][4])}</b><span>${k} · ${pa}타석${pa < 20 ? ' · 표본 적음' : ''}</span></div>`;
  }).join('');
  return `<div class="diamonds">${cells}</div>`;
}

function spray(cnt: Record<string, [number, number, number]>): string {
  const Z = ['좌', '좌중', '중', '우중', '우'], n = Z.reduce((a, z) => a + cnt[z][0], 0);
  if (!n) return '';
  const cx = 160, cy = 200, R0 = 30, R1 = 180, mx = Math.max(...Z.map((z) => cnt[z][0]));
  const A = (a: number, r: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
  let g = '';
  Z.forEach((z, i) => {
    const a1 = 135 - i * 18, a0 = a1 - 18, k = cnt[z][0];
    const [p0, p1, p2, p3] = [A(a0, R0), A(a0, R1), A(a1, R1), A(a1, R0)];
    const d = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${R1} ${R1} 0 0 0 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L${p3[0].toFixed(1)} ${p3[1].toFixed(1)} A${R0} ${R0} 0 0 1 ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Z`;
    const fa = 0.12 + (0.78 * k) / mx, m = A((a0 + a1) / 2, 140);
    g += `<path d="${d}" style="fill:color-mix(in srgb, var(--navy) ${Math.round(fa * 100)}%, var(--surface))" class="wd"/><text x="${m[0].toFixed(1)}" y="${(m[1] - 4).toFixed(1)}" class="wl${fa > 0.5 ? ' dk' : ''}">${n0((k / n) * 100)}%</text>`;
  });
  g += `<text x="${cx - 150}" y="${cy - 140}" class="wa">좌측</text><text x="${cx}" y="12" class="wa">중앙</text><text x="${cx + 150}" y="${cy - 140}" class="wa">우측</text>`;
  const leg = Z.map((z) => `<span><b>${z}</b> ${n0((cnt[z][0] / n) * 100)}% · 안타 ${cnt[z][1]} · 홈런 ${cnt[z][2]}</span>`).join('');
  return `<svg viewBox="0 0 320 210" class="spray" role="img" aria-label="타구 방향 비율">${g}</svg><div class="sleg">${leg}</div>`;
}

export function renderBatter(e: SituB): string {
  const sp = e.sp ?? {};
  let out = '';
  if (sp['좌투'] || sp['우투']) {
    out += h2('좌우 투수') + `<div class="hands">${hands(sp, [['좌투', 'vs 좌투수', true], ['우투', 'vs 우투수', false]], true)}</div>`;
    out += gap('좌투', sp['좌투']?.[4] ?? null, '우투', sp['우투']?.[4] ?? null, true);
  }
  const pt = (e.pt ?? []).filter((r) => r[1] >= 40).sort((a, b) => b[1] - a[1]);
  if (pt.length) {
    const tot = (e.pt ?? []).reduce((a, r) => a + r[1], 0);
    const rows = pt.map(([t, n, wh, rv]) => {
      const o = sp[t];
      return `<tr><td class="t"><b>${esc(t)}</b></td><td><span class="ub"><i style="width:${Math.min(100, (n / tot) * 250).toFixed(0)}%"></i></span><span class="ubn">${n0((n / tot) * 100)}%</span></td><td class="rvc">${rvBar(rv)}</td><td>${wh == null ? '-' : n0(wh) + '%'}</td><td>${o ? f3(o[4]) : '-'}<span class="pa">(${o ? o[0] : 0})</span></td></tr>`;
    }).join('');
    out += h2('구종별 대응', '', true);
    out += `<div class="tw"><table class="pt"><thead><tr><th class="t">구종</th><th>비율</th>${rvHead()}<th>헛스윙</th><th>OPS(타석)</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  out += zoneSection(e, [['전체', '전체', ''], ['좌투', '좌투수', '좌'], ['우투', '우투수', '우']], '스트라이크 존별 대응', '', true);
  if (Object.keys(sp).some((k) => /^\d-\d$/.test(k))) out += h2('카운트별 대응', '', true) + countGrid(sp, e.lgc, true);
  const sprayHtml = e.spray ? spray(e.spray) : '';
  const runners = sp['주자 없음'] ? `<div>${h2('주자 상황', 'OPS')}${diamonds(sp)}</div>` : '';
  if (sprayHtml || runners) {
    const n = e.spray ? Object.values(e.spray).reduce((a, v) => a + v[0], 0) : 0;
    const pullZ = e.side === 'L' ? ['우', '우중'] : ['좌', '좌중'];
    const pull = n ? (pullZ.reduce((a, z) => a + e.spray![z][0], 0) / n) * 100 : 0;
    const ha = sp['홈'] && sp['원정'] ? ` · 홈/원정 OPS ${f3(sp['홈'][4])} / ${f3(sp['원정'][4])}` : '';
    out += `<div class="two">${runners}${sprayHtml ? `<div>${h2('타구 방향', `인플레이 타구 ${n}개`)}${sprayHtml}
<p class="note">당겨친 쪽(${e.side === 'L' ? '우측·우중간' : '좌측·좌중간'}) ${n0(pull)}%${ha}</p></div>` : ''}</div>`;
  }
  return out || '<p class="soon">이 시즌은 상황별 기록이 없습니다.</p>';
}

// ---- 투수: 어디서 던지나(포수 시점 실루엣 + 릴리스 위치) · 움직임 그림 (release_mock.py, 2026-10-28 사용자 확정) ----
const slot = (a: number) => (a >= 70 ? '오버핸드' : a >= 35 ? '스리쿼터' : a >= 0 ? '사이드암' : '언더핸드(잠수함)');

// 포수 자리에서 본 상체(다리는 자름, 2026-10-28 사용자) + 어깨 둘레 팔 각도 부채(오버핸드~언더핸드), 이 투수 구간을 칠한다
function front(x: number, h: number, H: number, lg: [number, number] | undefined, throws: 'L' | 'R', ang: number): string {
  const side = throws === 'R' ? -1 : 1, W = 320, K = 1.3, R = 0.5 * H, top = Math.max(H + 12, 0.81 * H + R + 22, h + 30), bot = Math.min(0.81 * H - R - 10, h - 25), Ht = Math.round((top - bot) * K) + 24;
  const cx = W / 2 - side * 40, X = (cm: number) => cx + cm * K, Y = (cm: number) => 8 + (top - cm) * K, f = (v: number) => v.toFixed(1);
  const sh = 0.81 * H, sx = 0.11 * H, hip = 0.5 * H, ax = side * sx;
  let g = '';
  for (const cm of [50, 100, 150, 200]) if (cm > bot && cm < top) g += `<line x1="8" y1="${f(Y(cm))}" x2="${W - 8}" y2="${f(Y(cm))}" class="tick"/><text x="${side < 0 ? W - 10 : 10}" y="${f(Y(cm) - 3)}" class="tkl" text-anchor="${side < 0 ? 'end' : 'start'}">${cm}cm</text>`;
  // 팔 각도 부채: 수평 = 0°, 위 = 90°. 투수 구간만 진하게
  const P = (deg: number, r: number) => [X(ax + side * r * Math.cos((deg * Math.PI) / 180)), Y(sh + r * Math.sin((deg * Math.PI) / 180))];
  const zones: [string, number, number][] = [['오버핸드', 70, 105], ['스리쿼터', 35, 70], ['사이드암', 0, 35], ['언더핸드', -40, 0]];
  const mine = slot(ang).slice(0, 4);
  for (const [lab, a0, a1] of zones) {
    const [p0, p1] = [P(a0, R), P(a1, R)], sweep = side < 0 ? 1 : 0, on = lab.startsWith(mine);
    g += `<path d="M${f(X(ax))} ${f(Y(sh))} L${f(p0[0])} ${f(p0[1])} A${f(R * K)} ${f(R * K)} 0 0 ${sweep} ${f(p1[0])} ${f(p1[1])} Z" class="zone${on ? ' on' : ''}"/>`;
    const m = P((a0 + a1) / 2, R + 13);
    g += `<text x="${f(m[0])}" y="${f(m[1] + 4)}" class="zl${on ? ' on' : ''}" text-anchor="middle">${lab}</text>`;
  }
  // 상체: 엉덩이 높이에서 자르고 아래는 흐리게
  g += `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="cut"><rect x="0" y="0" width="${W}" height="${f(Y(hip - 12))}" fill="url(#fade)"/></mask></defs><g mask="url(#cut)">`;
  g += `<path d="M${f(X(-sx - 3))} ${f(Y(sh + 2))} Q${f(X(0))} ${f(Y(sh + 8))} ${f(X(sx + 3))} ${f(Y(sh + 2))} L${f(X(0.1 * H))} ${f(Y(hip - 12))} L${f(X(-0.1 * H))} ${f(Y(hip - 12))} Z" class="body"/>`;
  const gs = -side;
  g += `<path d="M${f(X(gs * sx))} ${f(Y(sh))} L${f(X(gs * (sx + 12)))} ${f(Y(sh - 28))} L${f(X(gs * 6))} ${f(Y(sh - 22))}" class="limb"/><ellipse cx="${f(X(gs * 6))}" cy="${f(Y(sh - 22))}" rx="11" ry="10" class="body"/></g>`;
  g += `<circle cx="${f(X(0))}" cy="${f(Y(0.905 * H))}" r="${f(0.062 * H * K)}" class="body"/>`;
  g += `<path d="M${f(X(-0.07 * H))} ${f(Y(0.93 * H))} Q${f(X(0))} ${f(Y(0.99 * H))} ${f(X(0.07 * H))} ${f(Y(0.93 * H))} Z" class="body"/>`;
  if (lg) g += `<circle cx="${f(X(lg[0]))}" cy="${f(Y(lg[1]))}" r="9" class="lgrel"/>`;
  g += `<path d="M${f(X(ax))} ${f(Y(sh))} L${f(X(x))} ${f(Y(h))}" class="limb arm"/><circle cx="${f(X(x))}" cy="${f(Y(h))}" r="8" class="ball"/>`;
  // 공 높이 표시: 공에서 눈금 쪽으로 점선
  const ex = side < 0 ? W - 52 : 52; // 눈금 글자(cm) 앞에서 멈춤
  g += `<line x1="${f(X(x))}" y1="${f(Y(h))}" x2="${ex}" y2="${f(Y(h))}" class="hline"/>`;
  const ty = Y(h) > Y(sh) ? Y(h) + 22 : Y(h) - 14;
  g += `<text x="${f(X(x))}" y="${f(ty)}" class="rvt" text-anchor="middle">${n0(h)}cm · ${ang}°</text>`;
  g += `<text x="${W / 2}" y="${Ht - 6}" class="tkl" text-anchor="middle">포수 자리에서 본 모습 · ${side < 0 ? '왼쪽 = 3루 쪽' : '오른쪽 = 1루 쪽'}</text>`;
  return `<svg viewBox="0 0 ${W} ${Ht}" class="front" role="img" aria-label="릴리스 위치: 높이 ${n0(h)}cm, 팔 각도 ${ang}도 ${slot(ang)}">${g}</svg>`;
}

function move(ars: NonNullable<SituP['ars']>, lgm: SituP['lgm'], throws: 'L' | 'R', name: string, season: string, lgslot?: string): string {
  const W = 320, H = 320, M = 30, K = 2.4, sx = (x: number) => W / 2 + x * K, sy = (y: number) => H / 2 - y * K, f = (v: number) => v.toFixed(1);
  const armLeft = throws === 'R';
  let g = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="ahd"/></marker></defs>';
  g += `<rect x="${armLeft ? M : W / 2}" y="${M}" width="${W / 2 - M}" height="${H - 2 * M}" class="armside"/>`;
  g += `<line x1="${M}" y1="${H / 2}" x2="${W - M}" y2="${H / 2}" class="ax"/><line x1="${W / 2}" y1="${M}" x2="${W / 2}" y2="${H - M}" class="ax"/>`;
  for (const r of [20, 40, 60]) g += `<circle cx="${W / 2}" cy="${H / 2}" r="${r * K}" class="ring"/>`;
  g += `<text x="${W / 2 + 3}" y="${H / 2 - 40 * K - 3}" class="tk">40cm</text>`;
  for (const [t, , , , hm, vm] of ars) {
    if (hm == null || vm == null) continue;
    const x = Math.max(M, Math.min(W - M, sx(hm))), y = Math.max(M, Math.min(H - M, sy(vm))), L = lgm[t];
    if (L) {
      const lx = sx(L[0]), ly = sy(L[1]);
      g += `<circle cx="${f(lx)}" cy="${f(ly)}" r="5" class="lgp"/>`;
      if (Math.hypot(x - lx, y - ly) > 9) g += `<line x1="${f(lx)}" y1="${f(ly)}" x2="${f(x)}" y2="${f(y)}" class="arw" marker-end="url(#ah)"/>`;
    }
    // 이름표는 화살표가 오는 반대쪽에 둔다(선과 겹치지 않게). 맨 위쪽 점은 아래에
    const right = L ? x >= sx(L[0]) : hm >= 0;
    const tx = f(x + (right ? 11 : -11)), anc = right ? 'start' : 'end', ty = f(y + (y < M + 22 ? 22 : 4));
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="7" class="pd"/><text x="${tx}" y="${ty}" class="pl" text-anchor="${anc}">${esc(t)}</text>`;
  }
  g += `<text x="${W / 2}" y="${M - 10}" class="tk" text-anchor="middle">덜 떨어짐(위로 솟음)</text><text x="${W / 2}" y="${H - M + 20}" class="tk" text-anchor="middle">더 떨어짐</text>`;
  const [a, b] = armLeft ? ['← 던지는 팔 쪽', '반대쪽 →'] : ['← 반대쪽', '던지는 팔 쪽 →'];
  g += `<text x="${M}" y="${H - M + 20}" class="tk${armLeft ? ' arml' : ''}">${a}</text><text x="${W - M}" y="${H - M + 20}" class="tk${armLeft ? '' : ' arml'}" text-anchor="end">${b}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="move" role="img" aria-label="구종별 움직임">${g}</svg>
<div class="mleg"><span><i class="lgp-sw"></i>${season} ${lgslot ? `${lgslot} 투수 평균` : `리그 평균(${throws === 'R' ? '우' : '좌'}투수)`}</span><span><i class="pd-sw"></i>${esc(name)}</span><span>화살표 = 평균에서 옮겨 간 방향</span></div>`;
}

export function renderPitcher(e: SituP, name: string, height: number, season: string): string {
  const sp = e.sp ?? {};
  let out = '';
  if (sp['좌타'] || sp['우타']) {
    out += h2('좌우 타자') + `<div class="hands">${hands(sp, [['좌타', 'vs 좌타자', true], ['우타', 'vs 우타자', false]], false)}</div>`;
    out += gap('좌타', sp['좌타']?.[4] ?? null, '우타', sp['우타']?.[4] ?? null, false);
  }
  const ars = e.ars ?? [];
  if (ars.length) {
    out += h2('구종 · 구종가치', '', true);
    const hasMove = ars.some((r) => r[4] != null);
    out += '<div class="arsenal">';
    if (e.rel) {
      const [x, h, ang] = e.rel, lg = e.lgr, hand = e.throws === 'R' ? '우투' : '좌투';
      out += `<div class="acol"><h3>어디서 던지나</h3>${front(x, h, height, lg, e.throws, ang)}
<p class="rcap"><b class="slot">${slot(ang)}</b> · 팔 각도 약 ${ang}°<br>공이 손을 떠나는 높이 <b>${n0(h)}cm</b>, 몸 가운데에서 ${e.throws === 'R' ? '3루' : '1루'} 쪽으로 <b>${n0(Math.abs(x))}cm</b>
${lg ? `<br><span class="muted">리그 ${hand} 평균(${n0(lg[1])}cm)${Math.abs(h - lg[1]) < 1.5 ? '과 비슷' : `보다 ${n0(Math.abs(h - lg[1]))}cm ${h > lg[1] ? '높음' : '낮음'}`}</span>` : ''}</p></div>`;
    }
    if (hasMove) out += `<div class="acol"><h3>공이 어떻게 휘나</h3>${move(ars, e.lgm, e.throws, name, season, e.lgslot)}</div>`;
    out += '</div>';
    // 전체 · 좌타자 · 우타자 탭(2026-10-28 사용자). 탭 전환은 [id].astro가 [data-side]로
    const sets: [string, string, Ars][] = [['전체', '전체', ars], ['좌타', '좌타자', e.arsS?.['좌타'] ?? []], ['우타', '우타자', e.arsS?.['우타'] ?? []]];
    const body = (rs: Ars) => rs.map(([t, u, v, w, hm, vm, rv, ops, pa]) => `<tr><td class="t"><b>${esc(t)}</b></td><td><span class="ub"><i style="width:${Math.min(100, u * 2.5).toFixed(0)}%"></i></span><span class="ubn">${u.toFixed(1)}%</span></td><td>${v?.toFixed(1) ?? '-'}</td><td>${w?.toFixed(1) ?? '-'}%</td>
<td class="rvc">${rvBar(rv)}</td><td>${f3(ops)}<span class="pa">(${pa})</span></td></tr>`).join('');
    const live = sets.filter(([, , rs]) => rs.length);
    out += '<div class="sgrp">';
    if (live.length > 1) out += `<div class="sidebar" role="group" aria-label="상대 타자 고르기">${live.map(([k, lab], i) => `<button type="button" data-side="${k}" aria-pressed="${i === 0}">${lab}</button>`).join('')}</div>`;
    out += `<div class="tw"><table class="pt"><thead><tr><th class="t">구종</th><th>비율</th><th>구속</th><th>헛스윙</th>${rvHead()}<th>피OPS(타석)</th></tr></thead>${live.map(([k, , rs], i) => `<tbody data-side-body="${k}"${i ? ' hidden' : ''}>${body(rs)}</tbody>`).join('')}</table></div></div>`;
  }
  out += zoneSection(e, [['전체', '전체', ''], ['좌타', '좌타자', '좌'], ['우타', '우타자', '우']], '스트라이크 존별 대응', '', false);
  if (Object.keys(sp).some((k) => /^\d-\d$/.test(k))) out += h2('카운트별 결과', '', true) + countGrid(sp, e.lgc, false);
  if (sp['주자 없음']) out += h2('주자 상황', '피OPS') + diamonds(sp);
  return out || '<p class="soon">이 시즌은 상황별 기록이 없습니다.</p>';
}
