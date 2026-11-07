/** A: 둥글고 두툼한 픽토그램. 기존 silhouette.ts와 독립적인 선택용 시안. */
export function silhouette(o: { pitcher?: boolean; height?: number; weight?: number; flip?: boolean; no?: string; numColor?: string; fill?: string }): string {
  const { pitcher = false, flip = false, no = '', numColor = '#080b10', fill = 'currentColor' } = o;
  const height = Number.isFinite(o.height) && o.height! > 0 ? o.height! : 183;
  const weight = Number.isFinite(o.weight) && o.weight! > 0 ? o.weight! : 88;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // 사용자 2026-11-07: 너무 말라 보임 → 전체 20kg쯤 더 찐 체격으로(폭 .8~1.2배 → 1.0~1.3배). 몸무게는 BMI 21~30 구간에 비례
  const k = 1.15 + .35 * clamp((weight / (height / 100) ** 2 - 21) / 9, 0, 1); // 기본 체격↑·몸무게 비례 폭 1.15~1.5배(사용자 2026-11-07: 운동선수인데 작음, 류현진은 대놓고 뚱뚱해 보여도 됨)
  // 183cm의 정수리는 -10, 발은 256. 195cm의 요청 배율 1.1은 상단 안전 여백으로 제한한다.
  const tall = height <= 183 ? .9 + .1 * (height - 170) / 13 : 1 + .1 * (height - 183) / 12;
  const sy = clamp(tall, .8, 278 / 266);
  const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const path = (d: string) => d ? `<path d="${d}"/>` : '';
  const soft = (d: string, opacity = '1') => `<g opacity="${opacity}" transform="translate(105 0) scale(${k} 1) translate(-105 0)">${path(d)}</g>`;
  // 머리·장비·신발은 가로 폭을 보존하고 몸의 연결 지점만 따라간다.
  const rigid = (x: number, d: string) => `<g transform="translate(${(x - 105) * (k - 1)} 0)">${path(d)}</g>`;
  // 어깨와 골반은 옆면으로 잇고 팔다리는 둥근 단색 면으로 겹친다.
  const shape = pitcher
    ? [
        '',
        'M83 112 Q104 108 119 127 Q140 153 157 182 Q173 207 183 239 Q179 248 160 248 Q145 220 129 202 Q111 183 96 160 Q81 188 64 207 L45 246 Q35 251 23 242 Q31 210 43 184 Q56 151 68 130 Q73 119 83 112 Z',
        'M118 28 Q133 28 138 44 Q143 62 130 84 Q119 107 118 129 Q99 144 73 127 Q72 112 81 91 L96 52 Q101 32 118 28 Z',
        // 던지는 팔은 뒤에서 위로 굽히고 글러브 팔은 오른쪽으로 길게 뻗는다.
        'M116 36 Q107 27 91 30 L70 39 Q68 25 73 11 Q76 0 66 -3 Q54 -6 51 7 Q45 27 46 45 Q47 61 61 63 Q74 64 99 53 L116 54 Z M125 35 Q137 33 148 43 Q162 53 176 57 Q185 61 182 72 Q179 82 168 78 Q146 73 128 61 Q116 55 117 45 Q118 39 125 35 Z',
        'M117 36 L119 20 Q112 13 114 2 Q114 -10 131 -10 Q147 -10 150 4 Q150 8 155 10 Q159 12 156 16 L150 19 Q149 30 137 30 L137 40 Z M114 5 Q111 -10 131 -10 Q147 -10 151 3 L159 4 Q165 4 165 9 Q165 13 159 13 L137 10 L116 11 Z',
        'M171 53 Q176 47 183 51 Q192 56 192 67 Q191 80 180 83 Q170 85 165 76 Q162 70 165 64 Q163 58 168 56 Z',
        'M23 238 Q33 235 45 240 L45 248 Q55 249 56 256 L15 256 Q11 250 19 245 Z M160 238 Q170 234 183 237 L187 246 Q201 248 201 256 L162 256 Q156 251 160 238 Z',
      ]
    : [
        'M69 58 L28 3 Q24 -3 29 -7 Q35 -11 39 -4 L77 52 Q81 58 76 62 Q72 65 69 58 Z',
        'M84 119 Q104 113 122 128 Q133 147 147 168 Q158 185 152 207 L151 241 Q142 248 127 242 Q122 221 125 199 L126 188 Q112 178 102 161 L86 194 Q79 216 70 245 Q57 250 45 241 Q48 209 56 184 Q64 161 67 141 Q70 126 84 119 Z',
        'M98 30 Q117 28 123 45 Q128 61 123 83 L126 126 Q107 142 77 128 Q75 110 78 89 Q76 70 79 53 Q82 36 98 30 Z',
        // 두 팔은 몸 뒤쪽 그립으로 모아 어깨의 정면 폭을 드러내지 않는다.
        'M99 38 Q110 39 111 52 Q112 66 101 78 Q90 89 77 82 Q65 76 57 64 L51 55 Q47 47 54 42 Q62 36 69 44 L80 56 Q84 60 87 58 L87 49 Q87 39 99 38 Z M109 48 Q121 49 120 62 Q119 78 105 86 Q92 93 80 81 L62 60 Q55 53 62 46 Q69 40 77 49 L91 64 Q97 67 99 57 Q101 48 109 48 Z',
        'M89 36 L89 22 Q80 18 80 6 Q79 -10 97 -10 Q113 -10 117 5 Q118 9 123 11 Q128 14 124 18 L117 20 Q115 30 105 30 L108 40 Z M79 10 Q75 -7 92 -10 Q108 -13 116 0 Q119 4 119 6 L125 7 Q131 7 131 12 Q131 16 125 16 L106 13 Q102 13 101 20 Q100 29 91 29 Q82 27 80 18 Z',
        '',
        'M45 237 Q57 234 70 240 L73 248 Q84 250 85 256 L37 256 Q34 249 42 244 Z M127 238 Q137 234 151 238 L157 246 Q170 249 171 256 L128 256 Q122 251 127 238 Z',
      ];

  const art = rigid(pitcher ? 60 : 60, shape[0])
    + soft(shape[1], '1') + soft(shape[2]) + soft(shape[3])
    + rigid(pitcher ? 132 : 99, shape[4])
    + rigid(pitcher ? 176 : 60, shape[5]);
  // 신발은 한 켤레를 확대하지 않고 각 발목을 따라 별도로 이동한다.
  const shoes = shape[6].split(/ (?=M)/).map((d, i) => rigid(i ? 166 : 39, d)).join('');
  // 번호도 SVG path: 외부 폰트 없이 동일한 굵기의 숫자. 반전 그룹 밖에 배치한다.
  const digits: Record<string, string> = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111',
    '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
    '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  };
  const chars = Array.from(no).filter(c => digits[c]);
  const unit = Math.min(5.2, 44 / Math.max(1, chars.length * 4 - 1)); // 등번호 키움(사용자 2026-11-07: 3.4 → 5.2)
  const nx = 105 + ((pitcher ? 107 : 98) - 105) * k;
  const screenX = flip ? 210 - nx : nx;
  const cells = chars.map((c, i) => Array.from(digits[c]).map((on, j) => {
    if (on !== '1') return '';
    const x = (i * 4 + j % 3) * unit;
    const y = Math.floor(j / 3) * unit;
    return `M${x} ${y}h${unit}v${unit}h${-unit}Z`;
  }).join('')).join('');
  const number = cells ? `<g fill="${esc(numColor)}" transform="translate(${screenX - (chars.length * 4 - 1) * unit / 2} ${pitcher ? 82 : 92})">${path(cells)}</g>` : '';
  return `<svg class="sil" viewBox="-20 -24 250 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g transform="translate(0 256) scale(1 ${sy}) translate(0 -256)"><g fill="${esc(fill)}"${flip ? ' transform="translate(210 0) scale(-1 1)"' : ''}>${art}${shoes}</g>${number}</g></svg>`;
}
