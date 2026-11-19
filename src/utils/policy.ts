import type { DaemonPolicies, PolicyEdits, PolicyKey } from "../types/deploy";

/**
 * 데몬 정책 입력 검사 — BE policy_spec.py 와 같은 규칙. 명세(범위 · 정규식 · 길이)는 BE 응답의 keys 를 그대로 쓴다.
 * FE 는 입력 칸에서 먼저 알려 주는 것뿐이고, 실제로 막는 건 BE(400) 다.
 */

const KIND_HINT: Record<string, string> = {
  local_path: "C:\\폴더 처럼 드라이브부터 쓴 경로(끝 \\ · '/' 없이)",
  unc_path: "\\\\IP\\공유 처럼 UNC 경로(끝 \\ 없이)",
  ftp_path: "/ 로 시작하고 / 로 끝나는 경로",
  ipv4: "IPv4 주소(예 192.168.100.205)",
  semver: "a.b.c 형식(예 0.0.10)",
  int_list: "쉼표로 이은 숫자 목록(예 6,7), 빈 원소 없이",
  word_list: "쉼표로 이은 영문 키워드(예 steal,banker), 빈 원소 없이",
};

const MIN_SCANNER_TAG = [0, 0, 10];

/** 칸 하나 검사. 문제 없으면 null. */
export function checkPolicyValue(key: PolicyKey, value: string): string | null {
  if (value === "") return "값을 넣어 주세요";
  if (/[\s=]/.test(value)) return "공백 · 탭 · 줄바꿈 · '=' 는 넣을 수 없습니다";
  if (key.max_length && value.length > key.max_length) return `${key.max_length}자 이하로 넣어 주세요`;
  if (key.kind === "uint") {
    if (!/^\+?[0-9]+$/.test(value)) return "숫자만 넣어 주세요";
    const n = Number(value);
    if ((key.min !== null && n < key.min) || (key.max !== null && n > key.max)) return `${key.min}~${key.max} 사이로 넣어 주세요`;
    return null;
  }
  if (key.pattern && !new RegExp(key.pattern).test(value)) {
    return key.kind === "semver" ? `형식이 맞지 않습니다 — ${KIND_HINT.semver}` : KIND_HINT[key.kind] ?? "형식이 맞지 않습니다";
  }
  if (key.kind === "semver") {
    const v = value.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if (v[i] !== MIN_SCANNER_TAG[i]) {
        if (v[i] < MIN_SCANNER_TAG[i]) return "0.0.10 이상이어야 합니다 (미만이면 ptnbuild QC 가 모두 실패)";
        break;
      }
    }
  }
  return null;
}

function norm(key: PolicyKey | undefined, value: string): string {
  return key?.kind === "uint" && /^\+?[0-9]+$/.test(value) ? String(Number(value)) : value;
}

/** 편집을 반영한 값 (서비스.키) */
function valueOf(p: DaemonPolicies, edits: PolicyEdits, service: string, key: string): string | undefined {
  return edits[service]?.[key] ?? p.services.find((s) => s.service === service)?.values[key];
}

function keyOf(p: DaemonPolicies, service: string, key: string): PolicyKey | undefined {
  return p.services.find((s) => s.service === service)?.keys.find((k) => k.name === key);
}

/** 편집 전체 검사 → { "서비스.키": 오류 }. 칸 검사 + 짝 값 검사. */
export function editErrors(p: DaemonPolicies, edits: PolicyEdits): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [service, kv] of Object.entries(edits)) {
    for (const [key, value] of Object.entries(kv)) {
      const k = keyOf(p, service, key);
      const msg = k ? checkPolicyValue(k, value) : "모르는 키";
      if (msg) out[`${service}.${key}`] = msg;
    }
  }
  for (const { a, b } of p.pairs) {
    const va = valueOf(p, edits, a.service, a.key);
    const vb = valueOf(p, edits, b.service, b.key);
    if (va === undefined || vb === undefined) continue;
    if (norm(keyOf(p, a.service, a.key), va) !== norm(keyOf(p, b.service, b.key), vb)) {
      out[`${a.service}.${a.key}`] ??= `${b.service}.${b.key} 와 같아야 합니다 — 같이 바꿔 주세요`;
      out[`${b.service}.${b.key}`] ??= `${a.service}.${a.key} 와 같아야 합니다 — 같이 바꿔 주세요`;
    }
  }
  return out;
}

export interface PolicyChange {
  service: string;
  key: string;
  from: string;
  to: string;
}

/** 원래 값과 다른 편집만 '이전 → 새 값' 목록으로 */
export function editList(p: DaemonPolicies, edits: PolicyEdits): PolicyChange[] {
  const out: PolicyChange[] = [];
  for (const s of p.services) {
    for (const k of s.keys) {
      const to = edits[s.service]?.[k.name];
      const from = s.values[k.name];
      if (to !== undefined && norm(k, to) !== norm(k, from ?? "")) out.push({ service: s.service, key: k.name, from, to });
    }
  }
  return out;
}

/** 서버에 보낼 바뀐 키만 */
export function changedOnly(p: DaemonPolicies, edits: PolicyEdits): PolicyEdits {
  const out: PolicyEdits = {};
  for (const c of editList(p, edits)) (out[c.service] ??= {})[c.key] = c.to;
  return out;
}
