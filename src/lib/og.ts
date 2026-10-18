// 공유 썸네일(og:image, 1200×630) — 빌드 때 satori(SVG) → resvg(PNG)로 만든다 (2026-10-16).
// 카톡·인스타·페북에 링크를 붙이면 이 그림이 미리보기로 나온다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE } from './site';

// 빌드 때는 번들 위치가 바뀌어 import.meta.url 기준 경로가 깨진다 → 프로젝트 루트(빌드 실행 위치) 기준
const font = (w: string) => readFileSync(join(process.cwd(), 'src/assets/fonts', `Pretendard-${w}.otf`));
const FONTS = [
  { name: 'Pretendard', data: font('SemiBold'), weight: 600 as const, style: 'normal' as const },
  { name: 'Pretendard', data: font('Bold'), weight: 700 as const, style: 'normal' as const },
  { name: 'Pretendard', data: font('ExtraBold'), weight: 800 as const, style: 'normal' as const },
];

const NAVY = '#041e42';
const RED = '#d00f31';

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

/** 글 제목이 길면 글자 크기를 줄인다 */
function titleSize(title: string): number {
  const n = [...title].length;
  if (n <= 16) return 76;
  if (n <= 24) return 66;
  if (n <= 34) return 58;
  return 50;
}

/** 대표 숫자(stat)가 있으면 숫자를 가장 크게, 제목은 그 아래 작게 (2026-10-18). 작은 카드 썸네일로 줄여도 숫자가 읽히게 */
function body(title: string, stat?: { value: string; label: string }): Node {
  if (!stat) {
    return h('div', {
      display: 'flex', flex: 1, alignItems: 'center',
      fontSize: titleSize(title), fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', wordBreak: 'keep-all',
    }, title);
  }
  const n = [...stat.value].length;
  return h('div', { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }, [
    h('div', { display: 'flex', alignItems: 'baseline', gap: 28 }, [
      h('div', { fontSize: n <= 6 ? 150 : n <= 10 ? 120 : 96, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }, stat.value),
    ]),
    h('div', { fontSize: 34, fontWeight: 700, color: '#ffb3c0', marginTop: 10, wordBreak: 'keep-all' }, stat.label),
    h('div', { fontSize: 40, fontWeight: 700, lineHeight: 1.3, marginTop: 26, opacity: 0.92, wordBreak: 'keep-all' }, title),
  ]);
}

export async function ogPng(opts: { title: string; label?: string; stat?: { value: string; label: string } }): Promise<Uint8Array> {
  const { title, label, stat } = opts;
  const tree = h('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    background: NAVY, color: '#fff', fontFamily: 'Pretendard',
  }, [
    h('div', { display: 'flex', flexDirection: 'column', flex: 1, padding: '64px 80px 0' }, [
      label
        ? h('div', { display: 'flex' }, [
            h('div', { background: RED, color: '#fff', fontSize: 30, fontWeight: 700, padding: '8px 22px', borderRadius: 999 }, label),
          ])
        : h('div', { display: 'flex' }, ''),
      body(title, stat),
    ]),
    h('div', { display: 'flex', alignItems: 'center', gap: 20, padding: '0 80px 48px' }, [
      logo(64),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { fontSize: 34, fontWeight: 800 }, SITE.title),
        h('div', { fontSize: 24, fontWeight: 600, opacity: 0.75 }, SITE.tagline),
      ]),
    ]),
    h('div', { display: 'flex', height: 14, background: RED }),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}

// 글 목록 카드용 작은 썸네일(480×360, 2026-10-18). 공유 썸네일을 줄이면 글자가 안 읽혀서 따로 만든다.
// 맨 위 짧은 이름(short) + 대표 숫자. 비교 값(items)은 칸을 나눠 숫자마다 아래에 꼬리표(연도·팀·구분)를 단다.
// 숫자만 두면 무엇의 숫자인지 몰라 직관성이 떨어진다는 사용자 피드백(2026-10-18). 대표 숫자가 없는 글은 로고만
const TW = 480;
const TH = 360;
const PINK = '#ffb3c0';

export type Stat = { value: string; label: string; short?: string; items?: { v: string; cap: string }[]; sep?: string };

/** "146.4km/h"처럼 끝에 영문 단위가 붙으면 숫자만 크게, 단위는 작게 */
function unitSplit(value: string): [string, string] | null {
  const m = value.match(/^([-+\d.,]+)([a-zA-Z/]{2,})$/);
  return m ? [m[1], m[2]] : null;
}
// 굵은 숫자·영문 한 글자 폭 ≈ 글자 크기의 0.6배, 한글은 1배
const em = (t: string) => [...t].reduce((a, c) => a + (/[가-힣]/.test(c) ? 1 : 0.6), 0);
const fit = (w: number, width: number, max: number) => Math.min(max, Math.floor(width / Math.max(0.6, w)));

function thumbBody(stat: Stat): Node[] {
  const top = stat.short
    ? [h('div', { fontSize: 38, fontWeight: 700, color: PINK, marginBottom: 6, whiteSpace: 'nowrap' }, stat.short)]
    : [];
  if (stat.items?.length) {
    const n = stat.items.length;
    const sep = stat.sep ?? '→';
    const colW = (TW - 56 - (n - 1) * 56) / n;
    const size = fit(Math.max(...stat.items.map((it) => em(it.v))), colW, 110);
    const cols: Node[] = [];
    stat.items.forEach((it, k) => {
      if (k > 0) cols.push(h('div', { display: 'flex', width: 56, justifyContent: 'center', fontSize: sep === 'vs' ? 34 : 52, fontWeight: 700, opacity: 0.7, paddingBottom: 40 }, sep));
      cols.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', width: colW }, [
        h('div', { fontSize: size, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap' }, it.v),
        h('div', { fontSize: 30, fontWeight: 700, opacity: 0.8, marginTop: 4, whiteSpace: 'nowrap' }, it.cap),
      ]));
    });
    return [...top, h('div', { display: 'flex', alignItems: 'center' }, cols)];
  }
  const unit = unitSplit(stat.value);
  const main = unit ? unit[0] : stat.value;
  const size = fit(em(main) + (unit ? em(unit[1]) * 0.3 + 0.2 : 0), TW - 72, 140);
  return [
    ...top,
    h('div', { display: 'flex', alignItems: 'baseline', gap: 8 }, [
      h('div', { fontSize: size, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }, main),
      ...(unit ? [h('div', { fontSize: 40, fontWeight: 700, opacity: 0.85 }, unit[1])] : []),
    ]),
  ];
}

export async function thumbPng(stat?: Stat): Promise<Uint8Array> {
  const tree = h('div', {
    width: TW, height: TH, display: 'flex', flexDirection: 'column',
    background: NAVY, color: '#fff', fontFamily: 'Pretendard',
  }, [
    h('div', { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' },
      stat ? thumbBody(stat) : [logo(150)]),
    h('div', { display: 'flex', height: 12, background: RED }),
  ]);
  const svg = await satori(tree as never, { width: TW, height: TH, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}
