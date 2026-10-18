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

// 글 목록 카드용 작은 썸네일(480×360, 2026-10-18). 공유 썸네일을 줄이면 글자가 안 읽혀서 대표 숫자만 크게 넣는다.
// "104.6 vs 94.3"·"81 → 110"처럼 비교하는 값은 두 줄로 나눠 글자를 키운다. 대표 숫자가 없는 글은 로고만
const TW = 480;
const TH = 360;

function thumbLines(value: string): string[] {
  const m = value.match(/^(.+?)\s+((?:vs|→)\s+.+)$/);
  return m ? [m[1], m[2]] : [value];
}
/** "146.4km/h"처럼 끝에 영문 단위가 붙으면 숫자만 크게, 단위는 아랫줄에 작게 */
function unitSplit(value: string): [string, string] | null {
  const m = value.match(/^([-+\d.,]+)([a-zA-Z/]{2,})$/);
  return m ? [m[1], m[2]] : null;
}

export async function thumbPng(stat?: { value: string }): Promise<Uint8Array> {
  const unit = stat ? unitSplit(stat.value) : null;
  const lines = stat ? (unit ? [unit[0]] : thumbLines(stat.value)) : [];
  const longest = Math.max(1, ...lines.map((l) => [...l].length));
  // 굵은 숫자 한 글자 폭 ≈ 글자 크기의 0.6배. 좌우 여백 36px씩
  const size = Math.min(lines.length > 1 ? 120 : 150, Math.floor((TW - 72) / (longest * 0.6)));
  const tree = h('div', {
    width: TW, height: TH, display: 'flex', flexDirection: 'column',
    background: NAVY, color: '#fff', fontFamily: 'Pretendard',
  }, [
    h('div', { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' },
      stat
        ? [
            ...lines.map((l) => h('div', { fontSize: size, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }, l)),
            ...(unit ? [h('div', { fontSize: Math.round(size * 0.4), fontWeight: 700, opacity: 0.85 }, unit[1])] : []),
          ]
        : [logo(150)]),
    h('div', { display: 'flex', height: 12, background: RED }),
  ]);
  const svg = await satori(tree as never, { width: TW, height: TH, fonts: FONTS });
  return new Resvg(svg).render().asPng();
}
