import { describe, expect, it } from "vitest";
import { diffInputs } from "./inputsDiff";

// 운영 postmark_log 원문 (2026-11-19 확인)
const ENG = "7zip=23.01 ixtearc=1.0.0.0 ixtebd=1.0.0.0 ixtebin=0.0.0.2";
const BASE18 =
  "photon=2026.11.18.01 elf=2026.11.18.01 bin=2026.11.18.01 script=2026.11.18.01 dex=2026.11.18.01 " +
  "plugins_x86=2026.11.18.01 plugins_x64=2026.11.18.01 except=2026.11.18.01 " +
  "bdcore_tes_x86=11.0.1.21 bdcore_tes_x64=11.0.1.21 bdcore_tlx_x86=11.0.1.21 bdcore_tlx_x64=11.0.1.21 ";
const L15 = BASE18 + ENG; // #15 시그널(ixtebd 1.0.0.0)
const L14 = L15.replace("ixtebd=1.0.0.0", "ixtebd=0.0.0.1");
const L16 = L15.replace("plugins_x86=2026.11.18.01", "plugins_x86=2026.11.19.01")
  .replace("plugins_x64=2026.11.18.01", "plugins_x64=2026.11.19.01")
  .replace("except=2026.11.18.01", "except=2026.11.19.01"); // #16 정시 — photon 은 어제 회차 그대로

describe("diffInputs — 앞 성공 배포와 비교해 바뀐 것만", () => {
  it("시그널 배포는 그 엔진만 바뀜", () => {
    const d = diffInputs(L15, L14, "2026-11-18 18:50:54");
    expect(d.engines).toEqual([{ label: "ixtebd", from: "0.0.0.1", to: "1.0.0.0" }]);
    expect(d.patterns).toEqual([]);
  });

  it("묶음(photon 5종 · BD 패턴 2종 · bdcore 4종)은 한 줄로, 오늘 회차 아닌 패턴은 stale", () => {
    const d = diffInputs(L16, L15, "2026-11-19 11:31:49");
    expect(d.engines).toEqual([]);
    expect(d.patterns).toEqual([
      { label: "BD 패턴", from: "2026.11.18.01", to: "2026.11.19.01" },
      { label: "BFExcept", from: "2026.11.18.01", to: "2026.11.19.01" },
    ]);
    expect(d.stale).toEqual([{ label: "photon 패턴", value: "2026.11.18.01" }]);
  });

  it("묶음 안 값이 서로 다르면 키마다", () => {
    const cur = L15.replace("elf=2026.11.18.01", "elf=2026.11.19.01");
    expect(diffInputs(cur, L15, "2026-11-19 12:00:00").patterns).toEqual([{ label: "elf", from: "2026.11.18.01", to: "2026.11.19.01" }]);
  });

  it("새 엔진(FIRST)은 from 없음, 앞 기록이 없으면 비교하지 않음", () => {
    const d = diffInputs(L15 + " ixtenew=1.0.0.3", L15, "2026-11-19 12:00:00");
    expect(d.engines).toEqual([{ label: "ixtenew", from: null, to: "1.0.0.3" }]);
    expect(diffInputs(L15, null, "2026-11-18 18:50:54")).toEqual({ engines: [], patterns: [], stale: [], compared: false });
  });

  it("실패 행의 '-' 값과 빠진 엔진은 바뀜으로 치지 않음", () => {
    const failed = "photon=- elf=- bin=- script=- dex=- plugins_x86=- plugins_x64=- except=-";
    const d = diffInputs(failed, L15, "2026-11-17 18:26:57");
    expect(d.engines).toEqual([]);
    expect(d.patterns).toEqual([]);
    expect(d.stale).toEqual([]);
  });
});
