// 공유 썸네일(og:image, 1200×630) — 빌드 때 satori(SVG) → resvg(PNG)로 만든다 (2026-10-16).
// 카톡·인스타·페북에 링크를 붙이면 이 그림이 미리보기로 나온다.
// 2026-10-19 새 단장: 블로그 화면과 같은 미색 바탕 + 연한 남색 숫자판(.claude/rules/design.md)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE } from './site';

// 빌드 때는 번들 위치가 바뀌어 import.meta.url 기준 경로가 깨진다 → 프로젝트 루트(빌드 실행 위치) 기준
const font = (f: string) => readFileSync(join(process.cwd(), 'src/assets/fonts', f));
const FONTS = [
  { name: 'Plex', data: font('IBMPlexSansKR-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex', data: font('IBMPlexSansKR-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  { name: 'Barlow', data: font('BarlowCondensed-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
];

// global.css 라이트 토큰과 같은 값
const BG = '#f3f2ee';
const TEXT = '#1c2433';
const MUTED = '#67675f';
const NAVY = '#0f2a52';
const BOARD = '#e2e6ee';
const RED = '#c4202f';

// satori는 React 없이 { type, props } 객체도 받는다
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

const logo = (size: number): Node => ({
  type: 'svg',
  props: {
    width: size, height: size, viewBox: '0 0 64 64',
    children: [
      { type: 'circle', props: { cx: 32, cy: 32, r: 29, fill: '#fff', stroke: RED, 'stroke-width': 4 } },
      { type: 'path', props: { d: 'M15 15c8 8 8 26 0 34M49 15c-8 8-8 26 0 34', fill: 'none', stroke: RED, 'stroke-width': 3, 'stroke-dasharray': '4 3' } },
    ],
  },
});

export type Stat = { value: string; label: string; short?: string; items?: { v: string; cap: string }[]; sep?: string };

/** 글 제목이 길면 글자 크기를 줄인다 */
function titleSize(title: string, withStat: boolean): number {
  const n = [...title].length;
  if (withStat) return n <= 20 ? 52 : n <= 30 ? 46 : 40;
  if (n <= 16) return 76;
  if (n <= 24) return 66;
  if (n <= 34) return 58;
  return 50;
}

/** "146.4km/h"처럼 끝에 영문 단위가 붙으면 숫자만 크게 */
const unitSplit = (v: string) => v.match(/^([-+\d.,]+)([a-zA-Z/%]{2,})$/)?.slice(1) ?? [v, ''];

/** 숫자판: 비교 값이면 칸을 나눠 숫자 아래 꼬리표, 아니면 숫자 하나. 아래에 한 줄 설명(label) */
function board(stat: Stat): Node {
  const big = { fontFamily: 'Barlow', fontWeight: 700, color: NAVY, lineHeight: 1 };
  let row: Node;
  if (stat.items?.length) {
    const len = Math.max(...stat.items.map((it) => [...it.v].length));
    const size = len <= 3 ? 150 : len <= 5 ? 120 : 96;
    const cols: Node[] = [];
    stat.items.forEach((it, k) => {
      if (k > 0) cols.push(h('div', { ...big, fontSize: stat.sep === 'vs' ? 44 : 64, opacity: 0.5, padding: '0 28px', paddingBottom: 40 }, stat.sep ?? '→'));
      cols.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center' }, [
        h('div', { ...big, fontSize: size }, it.v),
        h('div', { fontSize: 28, fontWeight: 600, color: NAVY, opacity: 0.8, marginTop: 6 }, it.cap),
      ]));
    });
    row = h('div', { display: 'flex', alignItems: 'center' }, cols);
  } else {
    const [main, unit] = unitSplit(stat.value);
    const n = [...main].length;
    row = h('div', { display: 'flex', alignItems: 'baseline', gap: 8 }, [
      h('div', { ...big, fontSize: n <= 5 ? 170 : n <= 8 ? 140 : 110 }, main),
      ...(unit ? [h('div', { fontSize: 40, fontWeight: 700, color: NAVY }, unit)] : []),
    ]);
  }
  return h('div', {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', alignSelf: 'flex-start',
    background: BOARD, borderRadius: 6, padding: '26px 40px 24px',
  }, [row, h('div', { fontSize: 28, fontWeight: 600, color: NAVY, opacity: 0.85, marginTop: 10 }, stat.label)]);
}

export async function ogPng(opts: { title: string; label?: string; stat?: Stat }): Promise<Uint8Array> {
  const { title, label, stat } = opts;
  const tree = h('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    background: BG, color: TEXT, fontFamily: 'Plex', padding: '52px 72px 40px', boxSizing: 'border-box',
  }, [
    label ? h('div', { fontSize: 30, fontWeight: 700, color: RED }, label) : h('div', { display: 'flex' }, ''),
    h('div', { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 28 }, [
      ...(stat ? [board(stat)] : []),
      h('div', { fontSize: titleSize(title, !!stat), fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', wordBreak: 'keep-all' }, title),
    ]),
    h('div', { display: 'flex', alignItems: 'center', gap: 16, borderTop: `3px solid ${NAVY}`, paddingTop: 22 }, [
      logo(52),
      h('div', { fontSize: 30, fontWeight: 700 }, SITE.title),
      h('div', { fontSize: 22, fontWeight: 600, color: MUTED, marginLeft: 6 }, SITE.tagline),
    ]),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}

// ── 선수 페이지 공유 썸네일(요청 M, 2026-11-03) ──────────────────────────────
// 이름·팀·포지션 + 최근 표본 충족 시즌 육각형(선수 페이지 Hexagon과 같은 모양) + 유형 + 등급(S+·S만, 목록 규칙과 같게).
// 표본 충족 시즌이 없으면 육각형 없이 이름·팀·유형만. 육각형 축 글자는 satori가 SVG 안 text에 글꼴을 못 넣어 div로 얹는다
const GRID = '#d9d6cc'; // --line
export type PlayerOg = {
  name: string; team: string; pos: string; type: string; grade: string | null;
  hex?: { head: string; vals: [string, number, string][] };
};

function hexNode(vals: [string, number, string][], size: number): Node {
  const R = size * 0.30, cx = size / 2, cy = size / 2;
  const ang = [0, 1, 2, 3, 4, 5].map((i) => -Math.PI / 2 + (i * Math.PI) / 3);
  const P = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const pts = (r: (i: number) => number) => ang.map((a, i) => P(r(i), a).map((v) => v.toFixed(1)).join(',')).join(' ');
  const at = (i: number) => R * Math.max(0.04, vals[i][1] / 100);
  const svg: Node = {
    type: 'svg',
    props: {
      width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { position: 'absolute', left: 0, top: 0 },
      children: [
        ...[0.25, 0.5, 0.75, 1].map((k) => ({ type: 'polygon', props: { points: pts(() => R * k), fill: 'none', stroke: k === 0.5 ? MUTED : GRID, 'stroke-width': k === 0.5 ? 1.5 : 1.5, ...(k === 0.5 ? { 'stroke-dasharray': '6 4' } : {}) } })),
        ...ang.map((a) => { const [x, y] = P(R, a); return { type: 'line', props: { x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1), stroke: GRID, 'stroke-width': 1.5 } }; }),
        { type: 'polygon', props: { points: pts(at), fill: NAVY, 'fill-opacity': 0.28, stroke: NAVY, 'stroke-width': 4, 'stroke-linejoin': 'round' } },
        ...ang.map((a, i) => { const [x, y] = P(at(i), a); return { type: 'circle', props: { cx: x.toFixed(1), cy: y.toFixed(1), r: 5.5, fill: NAVY } }; }),
      ],
    },
  };
  // 축 글자: 이름(작게) + 실제 값(크게, Barlow). 위치 기준점에서 좌/우/가운데 정렬
  const W = 160;
  const labels = vals.map(([lab, , raw], i) => {
    const a = ang[i];
    const anc = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    let [x, y] = P(R + 40, a);
    x += anc === 'start' ? -16 : anc === 'end' ? 16 : 0;
    const left = anc === 'start' ? x : anc === 'end' ? x - W : x - W / 2;
    const align = anc === 'start' ? 'flex-start' : anc === 'end' ? 'flex-end' : 'center';
    return h('div', {
      position: 'absolute', left, top: y - 36, width: W, height: 72,
      display: 'flex', flexDirection: 'column', alignItems: align, justifyContent: 'center',
    }, [
      h('div', { fontSize: 22, fontWeight: 600, color: TEXT, lineHeight: 1.1 }, lab),
      h('div', { fontFamily: 'Barlow', fontWeight: 700, fontSize: 32, color: NAVY, lineHeight: 1.05 }, raw),
    ]);
  });
  return h('div', { position: 'relative', display: 'flex', width: size, height: size }, [svg, ...labels]);
}

export async function ogPlayerPng(o: PlayerOg): Promise<Uint8Array> {
  const showGrade = o.grade === 'S+' || o.grade === 'S';
  const nameSize = [...o.name].length <= 4 ? 96 : [...o.name].length <= 7 ? 80 : 64;
  const left = h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: 18 }, [
    h('div', { fontSize: 32, fontWeight: 700, color: RED }, `${o.team} · ${o.pos}`),
    h('div', { fontSize: nameSize, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }, o.name),
    h('div', { display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 6 }, [
      ...(showGrade ? [h('div', { fontFamily: 'Barlow', fontWeight: 700, fontSize: 96, color: NAVY, lineHeight: 1 }, o.grade)] : []),
      h('div', { fontSize: 44, fontWeight: 700, color: NAVY }, o.type),
    ]),
    ...(o.hex ? [h('div', { fontSize: 26, fontWeight: 600, color: MUTED }, o.hex.head)] : []),
  ]);
  const tree = h('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    background: BG, color: TEXT, fontFamily: 'Plex', padding: '40px 72px 40px', boxSizing: 'border-box',
  }, [
    h('div', { display: 'flex', flex: 1, alignItems: 'center', gap: 24 }, [left, ...(o.hex ? [hexNode(o.hex.vals, 470)] : [])]),
    h('div', { display: 'flex', alignItems: 'center', gap: 16, borderTop: `3px solid ${NAVY}`, paddingTop: 22 }, [
      logo(52),
      h('div', { fontSize: 30, fontWeight: 700 }, SITE.title),
      h('div', { fontSize: 22, fontWeight: 600, color: MUTED, marginLeft: 6 }, SITE.tagline),
    ]),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}
