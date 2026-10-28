// 선수 페이지 상황별 탭(설계 docs/블로그/선수검색-설계.md 5절). 목업 gen4.py·release_mock.py의 그림을 옮긴 것.
// HTML 문자열을 돌려주는 함수라서 빌드 때(기본 시즌, set:html)와 브라우저에서(다른 시즌 버튼, situ.json을 받아) 똑같이 쓴다.
// 데이터 = scripts/export_players.py situ() → src/data/players-situ/<id>.json {시즌: 묶음}. 스타일 src/styles/situ.css

type Split = [number, number | null, number | null, number | null, number | null, number | null, number | null]; // 타석, 타율, 출루, 장타, OPS, 삼진%, 볼넷%
export type SituB = { sp?: Record<string, Split>; pt?: [string, number, number | null, number | null][]; spray?: Record<string, [number, number, number]>; lgc: Record<string, number>; side?: 'L' | 'R' };
export type SituP = {
  sp?: Record<string, Split>; ars?: [string, number, number, number, number, number, number | null, number | null, number][];
  rel?: [number, number, number]; throws: 'L' | 'R'; lgm: Record<string, [number, number]>; lgr?: [number, number]; lgc: Record<string, number>;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const f3 = (x: number | null | undefined) => (x == null ? '-' : Math.abs(x) < 1 ? x.toFixed(3).replace(/^(-?)0/, '$1') : x.toFixed(3));
const n0 = (x: number) => x.toFixed(0);

// 실루엣(Silhouette.astro와 같은 모양, 체격 기본값). 색은 currentColor
function sil(pitcher: boolean, flip: boolean): string {
  const k = 0.8 + 0.4 * Math.max(0, Math.min(1, (90 / 1.85 ** 2 - 21) / 9)), s = (0.86 * (0.9 + 0.2 * (15 / 25))).toFixed(3);
  const torso = (d: string) => d.replace(/(\d+) (\d+)/g, (_, x, y) => `${(105 + (Number(x) - 105) * k).toFixed(1)} ${y}`);
  const line = (pts: number[][]) => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L');
  const B = pitcher
    ? { arms: [[[126, 70], [160, 56], [176, 22]], [[92, 72], [62, 86], [46, 74]]], legs: [[[100, 134], [62, 172], [40, 242]], [[132, 134], [158, 190], [184, 244]]], feet: [[[28, 244], [50, 244]], [[176, 246], [196, 240]]],
        body: 'M78 62 Q112 46 144 64 L150 136 L92 146 L74 120 Z', head: [104, 38], cap: 'M124 36 Q122 16 104 16 Q86 16 84 34 L72 36 L74 42 L122 42 Z' }
    : { arms: [[[86, 70], [110, 84], [136, 54]], [[124, 68], [150, 76], [138, 54]]], legs: [[[88, 136], [72, 190], [62, 246]], [[122, 136], [140, 190], [150, 246]]], feet: [[[52, 248], [70, 248]], [[146, 248], [164, 248]]],
        body: 'M70 64 Q105 48 140 64 L146 142 L66 142 Z', head: [105, 36], cap: 'M85 34 Q86 14 106 14 Q124 14 126 32 L136 34 L134 40 L86 40 Z' };
  let g = pitcher ? '<circle cx="180" cy="15" r="9" stroke="none"/><ellipse cx="40" cy="74" rx="13" ry="11" stroke="none"/>'
    : '<rect x="146" y="-14" width="10" height="80" rx="5" stroke="none" transform="rotate(32 151 50)"/>';
  for (const p of B.arms) g += `<path d="${line(p)}" fill="none" stroke-width="${(24 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  g += `<path d="${torso(B.body)}" stroke="none"/>`;
  for (const p of B.legs) g += `<path d="${line(p)}" fill="none" stroke-width="${(33 * k).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (const p of B.feet) g += `<path d="${line(p)}" fill="none" stroke-width="16" stroke-linecap="round"/>`;
  g += `<circle cx="${B.head[0]}" cy="${B.head[1]}" r="21" stroke="none"/><path d="${B.cap}" stroke="none"/>`;
  return `<svg class="sil" viewBox="0 -24 210 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g transform="translate(105 256) scale(${flip ? -1 : 1} 1) scale(${s}) translate(-105 -252)" fill="currentColor" stroke="currentColor">${g}</g></svg>`;
}

const h2 = (t: string, small = '') => `<h2>${t}${small ? `<small>${small}</small>` : ''}</h2>`;

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
<p class="gapcap">${goodHigh ? 'OPS' : '피OPS'} 차이 <b>${f3(Math.abs(d))}</b> (${d > 0 ? aLab : bLab} 쪽이 높음)</p>`;
}

function rvBar(v: number | null, scale = 2): string {
  if (v == null) return '-';
  const w = Math.min(50, (Math.abs(v) / scale) * 50);
  return `<div class="rv"><i class="${v > 0 ? 'r pos' : 'l neg'}" style="width:${w.toFixed(0)}%"></i><em></em></div><span class="rvn">${v > 0 ? '+' : ''}${v.toFixed(2)}</span>`;
}
const rvHead = (who: string) => `<th class="rvh">구종가치 /100구<div class="rvaxis"><span>손해</span><span>0</span><span>${who} 이득</span></div></th>`;

// 카운트 판: 칸 색 = 리그 같은 카운트 대비 차이(0.5 OPS에서 최대), 20타석 미만 빗금
function countGrid(sp: Record<string, Split>, lg: Record<string, number>, goodHigh: boolean): string {
  let cells = '';
  for (let s = 0; s < 3; s++) for (let b = 0; b < 4; b++) {
    const k = `${b}-${s}`, row = sp[k], pa = row?.[0] ?? 0, ops = row?.[4] ?? null, L = lg[k];
    if (ops == null || !pa) { cells += `<div class="cc thin"><em>${k}</em><b>-</b><span>${pa}타석${pa ? ' · 타수 없음' : ''}</span></div>`; continue; }
    const d = ops - L, good = (d > 0) === goodHigh, a = Math.min(1, Math.abs(d) / 0.5);
    cells += `<div class="cc${pa < 20 ? ' thin' : ''}${a > 0.5 ? ' dk' : ''}" style="background:color-mix(in srgb, var(${good ? '--pos' : '--neg'}) ${Math.round(a * 85)}%, var(--surface))"><em>${k}</em><b>${f3(ops)}</b><span>${pa}타석 · 리그 ${f3(L)}</span></div>`;
  }
  return `<div class="cgrid-wrap"><div class="cg-y">스트라이크</div><div><div class="cg-x"><span>볼 0</span><span>1</span><span>2</span><span>3</span></div>
<div class="cgrid">${cells}</div></div><div class="cg-s"><span>0</span><span>1</span><span>2</span></div></div>
<div class="clegend"><span class="sw neg"></span>${goodHigh ? '리그보다 약함' : '리그보다 많이 맞음'}<span class="sw mid"></span>리그 수준<span class="sw pos"></span>${goodHigh ? '리그보다 강함' : '리그보다 잘 막음'}<span class="sw thinsw"></span>20타석 미만(표본 적음)</div>`;
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
      return `<tr><td class="t"><b>${esc(t)}</b></td><td><span class="ub"><i style="width:${Math.min(100, (n / tot) * 250).toFixed(0)}%"></i></span><span class="ubn">${n0((n / tot) * 100)}%</span></td><td class="rvc">${rvBar(rv)}</td><td>${wh == null ? '-' : n0(wh) + '%'}</td><td>${o ? f3(o[4]) : '-'}<small>${o ? o[0] : 0}</small></td></tr>`;
    }).join('');
    out += h2('구종별 대응');
    out += `<div class="tw"><table class="pt"><thead><tr><th class="t">구종</th><th>상대한 비율</th>${rvHead('타자')}<th>헛스윙률</th><th>결과 OPS<small>타석</small></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (Object.keys(sp).some((k) => /^\d-\d$/.test(k))) out += h2('카운트별 대응') + countGrid(sp, e.lgc, true);
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

function front(x: number, h: number, H: number, lg: [number, number] | undefined, throws: 'L' | 'R'): string {
  const W = 300, Ht = 300, K = 1.15, X = (cm: number) => W / 2 + cm * K, Y = (cm: number) => Ht - 26 - cm * K;
  const side = throws === 'R' ? -1 : 1, sh = 0.81 * H, sx = 0.11 * H, hip = 0.5 * H, f = (v: number) => v.toFixed(1);
  let g = '';
  for (const cm of [50, 100, 150, 200]) g += `<line x1="14" y1="${f(Y(cm))}" x2="${W - 14}" y2="${f(Y(cm))}" class="tick"/><text x="${W - 12}" y="${f(Y(cm) - 3)}" class="tkl" text-anchor="end">${cm}cm</text>`;
  g += `<line x1="8" y1="${f(Y(0))}" x2="${W - 8}" y2="${f(Y(0))}" class="ground"/>`;
  for (const d of [-1, 1]) g += `<path d="M${f(X(d * 0.06 * H))} ${f(Y(hip))} L${f(X(d * 0.17 * H))} ${f(Y(0.24 * H))} L${f(X(d * 0.22 * H))} ${f(Y(2))}" class="limb leg"/>`;
  g += `<path d="M${f(X(-sx - 3))} ${f(Y(sh + 2))} Q${f(X(0))} ${f(Y(sh + 8))} ${f(X(sx + 3))} ${f(Y(sh + 2))} L${f(X(0.09 * H))} ${f(Y(hip))} L${f(X(-0.09 * H))} ${f(Y(hip))} Z" class="body"/>`;
  g += `<circle cx="${f(X(0))}" cy="${f(Y(0.905 * H))}" r="${f(0.062 * H * K)}" class="body"/>`;
  g += `<path d="M${f(X(-0.07 * H))} ${f(Y(0.93 * H))} Q${f(X(0))} ${f(Y(0.99 * H))} ${f(X(0.07 * H))} ${f(Y(0.93 * H))} Z" class="body"/>`;
  const gs = -side;
  g += `<path d="M${f(X(gs * sx))} ${f(Y(sh))} L${f(X(gs * (sx + 12)))} ${f(Y(sh - 28))} L${f(X(gs * 6))} ${f(Y(sh - 22))}" class="limb"/><ellipse cx="${f(X(gs * 6))}" cy="${f(Y(sh - 22))}" rx="11" ry="10" class="body"/>`;
  if (lg) g += `<circle cx="${f(X(lg[0]))}" cy="${f(Y(lg[1]))}" r="9" class="lgrel"/>`;
  const ax = side * sx, ay = sh, mx = (ax + x) / 2, my = (ay + h) / 2;
  const nx = -(h - ay), ny = x - ax, L = Math.hypot(nx, ny) || 1, bend = 7 * ((side * nx) / L > 0 ? 1 : -1);
  g += `<path d="M${f(X(ax))} ${f(Y(ay))} L${f(X(mx + (nx / L) * bend))} ${f(Y(my + (ny / L) * bend))} L${f(X(x))} ${f(Y(h))}" class="limb arm"/><circle cx="${f(X(x))}" cy="${f(Y(h))}" r="7" class="ball"/>`;
  // 글자: 팔 바깥쪽에 두되, 판 밖으로 나가면 공 아래로
  const out = X(x) + side * 95 > 0 && X(x) + side * 95 < W;
  const tx = out ? X(x) + side * 14 : X(x), ty = out ? Y(h) - 10 : Y(h) + 24, anc = out ? (side < 0 ? 'end' : 'start') : 'middle';
  g += `<text x="${f(tx)}" y="${f(ty)}" class="rl" text-anchor="${anc}">공이 떠나는 곳</text><text x="${f(tx)}" y="${f(ty + 16)}" class="rvt" text-anchor="${anc}">높이 ${n0(h)}cm</text>`;
  g += `<text x="14" y="${Ht - 6}" class="tkl">3루 쪽</text><text x="${W - 14}" y="${Ht - 6}" class="tkl" text-anchor="end">1루 쪽</text><text x="${W / 2}" y="${Ht - 6}" class="tkl" text-anchor="middle">포수 자리에서 본 모습</text>`;
  return `<svg viewBox="0 0 ${W} ${Ht}" class="front" role="img" aria-label="릴리스 위치: 높이 ${n0(h)}cm">${g}</svg>`;
}

function move(ars: NonNullable<SituP['ars']>, lgm: SituP['lgm'], throws: 'L' | 'R', name: string, season: string): string {
  const W = 320, H = 320, M = 30, K = 2.4, sx = (x: number) => W / 2 + x * K, sy = (y: number) => H / 2 - y * K, f = (v: number) => v.toFixed(1);
  const armLeft = throws === 'R';
  let g = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="ahd"/></marker></defs>';
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
    const right = hm >= 0;
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="7" class="pd"/><text x="${f(x + (right ? 11 : -11))}" y="${f(y + 4)}" class="pl" text-anchor="${right ? 'start' : 'end'}">${esc(t)}</text>`;
  }
  g += `<text x="${W / 2}" y="${M - 10}" class="tk" text-anchor="middle">덜 떨어짐(위로 솟음)</text><text x="${W / 2}" y="${H - M + 20}" class="tk" text-anchor="middle">더 떨어짐</text>`;
  const [a, b] = armLeft ? ['← 던지는 팔 쪽', '반대쪽 →'] : ['← 반대쪽', '던지는 팔 쪽 →'];
  g += `<text x="${M}" y="${H - M + 20}" class="tk${armLeft ? ' arml' : ''}">${a}</text><text x="${W - M}" y="${H - M + 20}" class="tk${armLeft ? '' : ' arml'}" text-anchor="end">${b}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="move" role="img" aria-label="구종별 움직임">${g}</svg>
<div class="mleg"><span><i class="lgp-sw"></i>${season} 리그 평균(${throws === 'R' ? '우' : '좌'}투수)</span><span><i class="pd-sw"></i>${esc(name)}</span><span>화살표 = 리그 평균과 얼마나 다르게 움직이나</span></div>`;
}

function mvtxt(hm: number, vm: number, L: [number, number] | undefined, throws: 'L' | 'R'): string {
  if (!L || hm == null || vm == null) return '-';
  const dh = hm - L[0], dv = vm - L[1], arm = (dh < 0) === (throws === 'R');
  const v = Math.abs(dv) < 1.5 ? '높이는 리그와 비슷' : `<b>${n0(Math.abs(dv))}cm</b> ${dv > 0 ? '덜 떨어짐' : '더 떨어짐'}`;
  return v + (Math.abs(dh) < 1.5 ? '' : `<br><small>${arm ? '던지는 팔 쪽' : '반대쪽'}으로 ${n0(Math.abs(dh))}cm 더</small>`);
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
    out += h2('구종 · 구종가치');
    const hasMove = ars.some((r) => r[4] != null);
    out += '<div class="arsenal">';
    if (e.rel) {
      const [x, h, ang] = e.rel, lg = e.lgr, hand = e.throws === 'R' ? '우투' : '좌투';
      out += `<div class="acol"><h3>어디서 던지나</h3>${front(x, h, height, lg, e.throws)}
<p class="rcap"><b class="slot">${slot(ang)}</b> · 팔 각도 약 ${ang}°<br>공이 손을 떠나는 높이 <b>${n0(h)}cm</b>, 몸 가운데에서 ${e.throws === 'R' ? '3루' : '1루'} 쪽으로 <b>${n0(Math.abs(x))}cm</b>
${lg ? `<br><span class="muted">점선 원 = 리그 ${hand} 평균(${n0(lg[1])}cm). 높이는 리그보다 ${Math.abs(h - lg[1]) < 1.5 ? '비슷' : `${n0(Math.abs(h - lg[1]))}cm ${h > lg[1] ? '높음' : '낮음'}`}</span>` : ''}</p></div>`;
    }
    if (hasMove) out += `<div class="acol"><h3>공이 어떻게 휘나</h3>${move(ars, e.lgm, e.throws, name, season)}</div>`;
    out += '</div>';
    const rows = ars.map(([t, u, v, w, hm, vm, rv, oa, pa]) => `<tr><td class="t"><b>${esc(t)}</b></td><td><span class="ub"><i style="width:${Math.min(100, u * 2.5).toFixed(0)}%"></i></span><span class="ubn">${u.toFixed(1)}%</span></td><td>${v?.toFixed(1) ?? '-'}</td><td>${w?.toFixed(1) ?? '-'}%</td>
<td class="mvd">${mvtxt(hm, vm, e.lgm[t], e.throws)}</td><td class="rvc">${rvBar(rv)}</td><td>${f3(oa)}<small>${pa}</small></td></tr>`).join('');
    out += `<div class="tw"><table class="pt"><thead><tr><th class="t">구종</th><th>비율</th><th>평균 km/h</th><th>헛스윙률</th><th>리그 대비 움직임</th>${rvHead('투수')}<th>피안타율<small>타석</small></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  if (Object.keys(sp).some((k) => /^\d-\d$/.test(k))) out += h2('카운트별 결과') + countGrid(sp, e.lgc, false);
  if (sp['주자 없음']) out += h2('주자 상황', '피OPS') + diamonds(sp);
  return out || '<p class="soon">이 시즌은 상황별 기록이 없습니다.</p>';
}
