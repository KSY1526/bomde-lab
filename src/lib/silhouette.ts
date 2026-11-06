/** 선수 윤곽을 공유한다. 좌표는 발바닥 y=252, 체격 변환의 중심 x=105 기준. */
export function silhouette(o: { pitcher?: boolean; height?: number; weight?: number; flip?: boolean; no?: string; numColor?: string; fill?: string }): string {
  const { pitcher = false, flip = false, no = '', numColor = '#000', fill = 'currentColor' } = o;
  const height = Number.isFinite(o.height) && o.height! > 0 ? o.height! : 183;
  const weight = Number.isFinite(o.weight) && o.weight! > 0 ? o.weight! : 88;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const tall = 0.9 + 0.2 * clamp((height - 170) / 25);
  const k = 0.8 + 0.4 * clamp((weight / (height / 100) ** 2 - 21) / 9);
  const s = (0.86 * tall).toFixed(3);
  const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const path = (d: string) => `<path fill-rule="evenodd" d="${d}"/>`;
  // 머리·장비·신발은 연결 지점만 옮겨 몸의 가로 확대에 따라 찌그러지지 않는다.
  const rigid = (x: number, d: string) => `<g transform="translate(${(x - 105) * (k - 1)} 0)">${path(d)}</g>`;

  const body = pitcher
    ? [
        // 뒤로 젖힌 오른팔: 넓은 소매, 굽힌 팔꿈치, 세운 전완과 공 쥔 손.
        'M119 66 Q132 60 143 68 L159 79 Q164 81 165 73 L160 43 L158 33 Q155 28 158 24 L162 23 L164 18 Q168 16 172 20 L178 23 Q181 27 177 33 L173 42 L181 75 Q185 89 176 97 Q169 102 160 97 L136 86 L126 88 Z',
        // 앞으로 뻗은 왼팔. 소매 끝의 꺾임과 팔꿈치의 완만한 굴곡.
        'M90 69 Q80 65 70 70 L53 80 L35 77 L30 89 Q49 97 59 94 L84 85 L97 85 Z',
        // 뒷다리는 마운드를 밀고, 앞다리는 벌려 착지한다.
        'M116 135 Q133 133 141 146 L154 175 Q157 183 163 190 L183 233 L180 243 L167 245 L162 235 L144 204 Q133 191 127 178 L112 159 Z',
        'M90 134 L119 145 Q105 166 86 181 Q77 187 73 199 L54 242 L38 241 Q41 219 47 200 L51 184 Q53 174 64 163 Z',
        // 비틀린 상의와 골반. 허리와 어깨의 틈은 실제 투명 구멍이다.
        'M91 60 Q107 56 121 64 L135 72 L133 89 Q127 106 135 122 L132 129 L138 138 Q121 150 96 148 L86 143 L88 135 L81 132 L85 120 L78 102 L78 82 Z M91 132 Q111 138 130 130 L130 133 Q112 142 91 135 Z M84 88 L89 94 L88 106 Z M124 116 L130 124 L120 126 L126 122 Z',
      ].map(path).join('')
    : [
        // 후방 팔: 손을 귀 뒤로 모으고 팔꿈치를 들어 타격을 준비한다.
        'M120 67 Q129 62 137 68 L158 85 Q165 93 159 99 Q154 103 148 97 L130 83 L123 85 Z',
        // 굽힌 무릎과 종아리, 바지 밑단. 두 다리 사이는 열린 공간.
        'M111 139 L136 140 Q143 158 153 177 Q158 187 153 199 L147 217 L152 241 L137 245 Q130 223 132 208 L135 191 Q122 180 113 164 Z',
        'M79 139 L108 146 Q99 167 86 184 Q80 192 79 205 L70 243 L54 243 Q55 224 58 205 L61 186 Q62 177 69 164 Z',
        // 옆에서 보이는 등판. 소매·옷자락을 직선 사각형 대신 곡선으로 잇는다.
        'M89 60 Q101 56 114 61 L129 70 L129 86 Q123 104 130 123 L127 130 L134 139 Q108 150 77 143 L73 136 L78 128 L74 112 Q69 96 74 79 Z M80 134 Q102 139 126 133 L126 136 Q103 143 81 137 Z M78 111 L83 119 L80 127 Z M119 119 L124 126 L115 129 L120 125 Z',
        // 가까운 팔: 아래 팔꿈치에서 손으로 올라가는 삼각형의 빈 공간.
        'M82 70 Q92 68 99 78 L106 89 L124 72 L132 62 Q136 58 141 61 L145 66 L142 73 L133 79 L114 104 Q107 111 100 106 L82 91 L77 82 Z',
      ].map(path).join('');

  const head = pitcher
    ? rigid(100, 'M90 48 L89 62 Q101 70 112 62 L109 52 Q117 47 117 37 L114 29 L88 29 L84 39 L79 45 L86 48 L87 53 Z M83 31 Q82 15 98 13 Q116 12 120 28 L120 32 L96 33 Q81 37 68 33 L67 30 Z')
    : rigid(96, 'M84 43 L82 48 L87 51 L87 56 L94 58 L93 64 Q103 70 113 65 L108 53 L112 41 L106 28 L85 29 Z M79 34 Q76 18 89 14 Q106 8 116 22 Q121 31 117 41 L110 46 L107 54 L100 54 Q94 49 96 40 L83 40 L69 38 L68 34 Z M101 40 Q106 37 109 41 L108 47 L103 48 Z');
  const equipment = pitcher
    // 글러브의 손가락과 포구 면을 윤곽과 투명 틈으로 표현한다.
    ? rigid(29, 'M38 79 Q34 71 29 71 L22 65 Q18 65 19 72 L14 68 Q10 69 13 77 Q7 73 7 79 L11 91 Q14 100 24 100 L34 96 L40 88 Z M17 80 L23 86 L32 82 L25 90 Z')
    // 배럴은 굵고 손잡이로 갈수록 가늘어진다. 손 뒤에 배치한다.
    : rigid(138, 'M137 66 L155 3 Q157 -4 162 -3 Q167 -2 165 5 L143 68 L144 72 L137 74 L134 71 Z');
  const feet = pitcher
    ? rigid(46, 'M38 236 L54 238 L53 244 L57 248 L56 252 L25 252 Q23 247 29 244 Z') + rigid(175, 'M167 238 L180 234 L185 241 L197 245 Q201 247 198 251 L174 252 L166 248 Z')
    : rigid(62, 'M55 238 L70 239 L71 245 L77 248 L76 252 L43 252 Q42 247 47 245 Z') + rigid(145, 'M136 239 L151 237 L155 244 L167 247 Q170 250 167 252 L138 252 L134 248 Z');
  const numX = 105 + ((pitcher ? 108 : 106) - 105) * k;
  const number = no ? `<text x="${numX}" y="122" text-anchor="middle" font-size="${pitcher ? 33 : 36}" font-weight="700" style="font-family:var(--num)" fill="${esc(numColor)}"${flip ? ` transform="translate(${2 * numX} 0) scale(-1 1)"` : ''}>${esc(no)}</text>` : '';
  return `<svg class="sil" viewBox="0 -24 210 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="${esc(fill)}" transform="translate(105 256) scale(${flip ? -1 : 1} 1) scale(${s}) translate(-105 -252)">${equipment}<g transform="translate(105 0) scale(${k} 1) translate(-105 0)">${body}</g>${head}${feet}${number}</g></svg>`;
}
