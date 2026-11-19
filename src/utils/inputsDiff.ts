import { parseInputs } from "./inputs";

/**
 * postmark_log.inputs 두 개(이번 · 바로 앞 성공 배포)를 비교해 이번 배포에서 바뀐 것만 고른다.
 *
 * inputs 형식 (postmark NpPmInput.cpp fnFormat, 2026-11-19 확인): `key=value` 를 공백 한 칸으로 잇는다. 빈 값은 '-'.
 * - photon elf bin script dex : ptnbuild 패턴 회차(YYYY.MM.DD.NN)
 * - plugins_x86 plugins_x64   : BD 패턴 회차, except : BFExcept 회차 (bdupdate)
 * - bdcore_tes_x86 · _x64 · bdcore_tlx_x86 · _x64 : BD 엔진 버전
 * - 나머지 키는 deploy_target.project_name = GitLab 태그(엔진)
 * 정시 · 수동 배포는 archive 의 가장 큰 회차를 날짜 확인 없이 고르므로 그날 빌드가 실패하면 어제 회차가 나간다 → stale.
 */

interface Group {
  label: string;
  keys: string[];
  /** 값이 회차(YYYY.MM.DD.NN)라 날짜로 '그날 것인지' 볼 수 있음 */
  dated: boolean;
}

const GROUPS: Group[] = [
  { label: "photon 패턴", keys: ["photon", "elf", "bin", "script", "dex"], dated: true },
  { label: "BD 패턴", keys: ["plugins_x86", "plugins_x64"], dated: true },
  { label: "BFExcept", keys: ["except"], dated: true },
  { label: "BD 엔진", keys: ["bdcore_tes_x86", "bdcore_tes_x64", "bdcore_tlx_x86", "bdcore_tlx_x64"], dated: false },
];
const PATTERN_KEYS = new Set(GROUPS.flatMap((g) => g.keys));

export interface InputChange {
  label: string;
  /** 앞 배포 값. 새로 들어온 엔진(FIRST)은 null */
  from: string | null;
  to: string;
}

export interface InputsDiff {
  engines: InputChange[];
  patterns: InputChange[];
  /** 배포한 날짜의 회차가 아닌 패턴 (어제 회차가 나감) */
  stale: { label: string; value: string }[];
  /** 앞 성공 배포가 있어 비교했는지 */
  compared: boolean;
}

const real = (v: string | undefined) => (v === undefined || v === "-" ? null : v);

function toMap(s: string | null): Map<string, string> {
  const p = s ? parseInputs(s) : null;
  return new Map(p?.ok ? p.pairs : []);
}

export function diffInputs(inputs: string, prevInputs: string | null, loggedAt: string): InputsDiff {
  const cur = toMap(inputs);
  const prev = toMap(prevInputs);
  const compared = prevInputs !== null;
  const changed = (k: string): InputChange | null => {
    const to = real(cur.get(k));
    const from = real(prev.get(k));
    return compared && to !== null && to !== from ? { label: k, from, to } : null;
  };

  const engines: InputChange[] = [];
  for (const k of cur.keys()) {
    if (PATTERN_KEYS.has(k)) continue;
    const c = changed(k);
    if (c) engines.push(c);
  }

  const patterns: InputChange[] = [];
  const stale: { label: string; value: string }[] = [];
  const day = loggedAt.slice(0, 10).replace(/-/g, ".");
  for (const g of GROUPS) {
    const cs = g.keys.map(changed).filter((c): c is InputChange => c !== null);
    const same = (xs: (string | null)[]) => xs.every((x) => x === xs[0]);
    if (cs.length === g.keys.length && same(cs.map((c) => c.from)) && same(cs.map((c) => c.to))) {
      patterns.push({ label: g.label, from: cs[0].from, to: cs[0].to });
    } else {
      patterns.push(...cs);
    }
    if (g.dated) {
      const vals = g.keys.map((k) => real(cur.get(k))).filter((v): v is string => v !== null && v.slice(0, 10) < day);
      if (vals.length === g.keys.length && same(vals)) stale.push({ label: g.label, value: vals[0] });
      else for (const k of g.keys) {
        const v = real(cur.get(k));
        if (v !== null && v.slice(0, 10) < day) stale.push({ label: k, value: v });
      }
    }
  }
  return { engines, patterns, stale, compared };
}
