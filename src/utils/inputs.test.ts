import { describe, expect, it } from "vitest";
import { parseInputs } from "./inputs";

describe("parseInputs", () => {
  it("공백으로 나뉜 key=value", () => {
    expect(parseInputs("A=1 B=2")).toEqual({ pairs: [["A", "1"], ["B", "2"]], raw: "A=1 B=2", ok: true });
  });

  it("세미콜론 · 쉼표도 구분자", () => {
    expect(parseInputs("A=1;B=2").pairs).toEqual([["A", "1"], ["B", "2"]]);
    expect(parseInputs("A=1, B=2").pairs).toEqual([["A", "1"], ["B", "2"]]);
  });

  it("값에 = 이 더 있으면 첫 = 에서만 나눔", () => {
    expect(parseInputs("X=a=b").pairs).toEqual([["X", "a=b"]]);
  });

  it("key=value 가 아닌 조각이 있으면 ok=false 로 원문만", () => {
    const r = parseInputs("엔진 실패");
    expect(r.ok).toBe(false);
    expect(r.raw).toBe("엔진 실패");
  });

  it("빈 문자열", () => {
    expect(parseInputs("")).toEqual({ pairs: [], raw: "", ok: true });
  });
});
