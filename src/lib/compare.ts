// 육각형 비교 그림·표(설계 6절). 겹친 육각형: 면 투명도 0.12, 선 2.5px, 점선 = 리그 중간(50). 표: 행 = 6축 + 유형, 칸 = 실제 값 크게 + 백분위 작게, 셋 중 최고 밑줄
type Hex = { vals: [string, number, string][]; type: string };
export type Item = { name: string; year: string; hex: Hex; color: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function compareHex(items: Item[], size = 380): string {
  const R = size * 0.32, cx = size / 2, cy = size / 2;
  const ang = [0, 1, 2, 3, 4, 5].map((i) => -Math.PI / 2 + (i * Math.PI) / 3);
  const P = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const pts = (r: (i: number) => number) => ang.map((a, i) => P(r(i), a).map((v) => v.toFixed(1)).join(',')).join(' ');
  let g = '';
  for (const k of [0.25, 0.5, 0.75, 1]) g += `<polygon points="${pts(() => R * k)}" class="${k === 0.5 ? 'avg' : 'grid'}"/>`;
  for (const a of ang) { const [x, y] = P(R, a); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="grid"/>`; }
  for (const it of items) {
    const at = (i: number) => R * Math.max(0.04, it.hex.vals[i][1] / 100);
    g += `<polygon points="${pts(at)}" style="fill:${it.color};stroke:${it.color}" class="shape"><title>${esc(it.name)} ${it.year}: ${it.hex.vals.map(([l, p, v]) => `${l} ${v}(${p})`).join(', ')}</title></polygon>`;
    for (let i = 0; i < 6; i++) { const [x, y] = P(at(i), ang[i]); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" style="fill:${it.color}" class="dot"/>`; }
  }
  // 구원투수는 WAR 자리가 WPA라 섞이면 'WAR/WPA'
  const labs = items[0].hex.vals.map((_, i) => [...new Set(items.map((it) => it.hex.vals[i][0]))].join('/'));
  labs.forEach((lab, i) => {
    const a = ang[i], [x, y] = P(R + 22, a), anc = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    g += `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${anc}" class="hl">${esc(lab)}</text>`;
  });
  return `<svg viewBox="0 0 ${size} ${size}" class="cmphex" role="img" aria-label="${items.map((it) => `${esc(it.name)} ${it.year}`).join(', ')} 육각형 겹쳐 보기">
<style>.cmphex{width:100%;max-width:380px;display:block;margin:0 auto;overflow:visible}.cmphex .grid{fill:none;stroke:var(--line)}.cmphex .avg{fill:none;stroke:var(--muted);stroke-dasharray:4 3}
.cmphex .shape{fill-opacity:.12;stroke-width:2.5;stroke-linejoin:round}.cmphex .dot{stroke:var(--bg);stroke-width:2}.cmphex .hl{font:600 13px var(--font);fill:var(--text)}</style>${g}</svg>`;
}

export function compareTable(items: Item[]): string {
  const head = `<thead><tr><th class="t"></th>${items.map((it) => `<th><i style="background:${it.color}"></i>${esc(it.name)}<small>${it.year}</small></th>`).join('')}</tr></thead>`;
  const rows = items[0].hex.vals.map((_, k) => {
    const lab = [...new Set(items.map((it) => it.hex.vals[k][0]))].join('/');
    const ps = items.map((it) => it.hex.vals[k][1]), best = Math.max(...ps);
    return `<tr><td class="t">${esc(lab)}</td>${items.map((it) => { const [, p, raw] = it.hex.vals[k]; return `<td class="${items.length > 1 && p === best ? 'best' : ''}"><b>${esc(raw)}</b><small>${p}</small></td>`; }).join('')}</tr>`;
  }).join('');
  return `${head}<tbody>${rows}<tr><td class="t">유형</td>${items.map((it) => `<td class="ty">${esc(it.hex.type ?? '')}</td>`).join('')}</tr></tbody>`;
}
