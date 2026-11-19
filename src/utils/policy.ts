import type { DaemonPolicies, PolicyEdits, PolicyKey } from "../types/deploy";
import { normalizeDeployTime } from "./deployTime";

/**
 * 데몬 정책 입력 검사 — BE policy_spec.py 와 같은 규칙. 명세(범위 · 정규식 · 길이)는 BE 응답의 keys 를 그대로 쓴다.
 * FE 는 입력 칸에서 먼저 알려 주는 것뿐이고, 실제로 막는 건 BE(400) 다.
 */

const KIND_HINT: Record<string, string> = {
  local_path: "C:\\폴더 처럼 드라이브부터 쓴 경로(끝 \\ · '/' 없이)",
  unc_path: "\\\\IP\\공유 처럼 UNC 경로(끝 \\ 없이)",
  ipv4: "IPv4 주소(예 192.168.100.205)",
  hhmm: "HH:MM 형식(00:00~23:59, 예 11:30)",
};

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
    return KIND_HINT[key.kind] ?? "형식이 맞지 않습니다";
  }
  return null;
}

function norm(key: PolicyKey | undefined, value: string): string {
  if (key?.kind === "uint" && /^\+?[0-9]+$/.test(value)) return String(Number(value));
  if (key?.kind === "hhmm") return normalizeDeployTime(value) ?? value;
  return value;
}

function keyOf(p: DaemonPolicies, service: string, key: string): PolicyKey | undefined {
  return p.services.find((s) => s.service === service)?.keys.find((k) => k.name === key);
}

/** 편집 전체 검사 → { "서비스.키": 오류 }. */
export function editErrors(p: DaemonPolicies, edits: PolicyEdits): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [service, kv] of Object.entries(edits)) {
    for (const [key, value] of Object.entries(kv)) {
      const k = keyOf(p, service, key);
      const msg = k ? checkPolicyValue(k, value) : "모르는 키";
      if (msg) out[`${service}.${key}`] = msg;
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
