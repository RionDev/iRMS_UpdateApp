/**
 * postmark_log.inputs("패턴 회차 · 엔진별 태그 · BD 버전/회차, key=value 한 줄")를 key/value 로 푼다.
 * 구분자는 공백 · 세미콜론 · 쉼표 아무거나. key=value 가 아닌 조각이 하나라도 있으면 ok=false — 화면은 원문만 보인다.
 */
export interface ParsedInputs {
  pairs: [string, string][];
  raw: string;
  ok: boolean;
}

export function parseInputs(s: string): ParsedInputs {
  const parts = s.split(/[\s;,]+/).filter(Boolean);
  const pairs: [string, string][] = [];
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i <= 0) return { pairs: [], raw: s, ok: false };
    pairs.push([p.slice(0, i), p.slice(i + 1)]);
  }
  return { pairs, raw: s, ok: true };
}
