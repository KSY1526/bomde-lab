// 숫자 뒤 조사: 끝자리 읽는 소리에 받침이 있으면(영 일 삼 육 칠 팔) '이다·을·으로', ㄹ 받침(일 칠 팔)은 '로'
const last = (s: string | number) => String(s).slice(-1);
const batchim = (s: string | number) => '013678'.includes(last(s));
const rieul = (s: string | number) => '178'.includes(last(s));
export const ida = (s: string | number) => `${s}${batchim(s) ? '이다' : '다'}`;
export const ieot = (s: string | number) => `${s}${batchim(s) ? '이었다' : '였다'}`;
export const ieotgo = (s: string | number) => `${s}${batchim(s) ? '이었고' : '였고'}`;
export const igo = (s: string | number) => `${s}${batchim(s) ? '이고' : '고'}`;
export const ro = (s: string | number) => `${s}${batchim(s) && !rieul(s) ? '으로' : '로'}`;
export const eul = (s: string | number) => `${s}${batchim(s) ? '을' : '를'}`;
