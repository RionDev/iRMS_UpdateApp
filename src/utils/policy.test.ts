import { describe, expect, it } from "vitest";
import type { DaemonPolicies, PolicyKey } from "../types/deploy";
import { checkPolicyValue, editErrors, editList } from "./policy";

const uint = (min: number, max: number): PolicyKey => ({
  name: "CHECK_SEC", kind: "uint", label: "확인 주기(초)", help: "", min, max, readonly: null,
  pattern: "^\\+?[0-9]+$", max_length: null,
});
const path: PolicyKey = {
  name: "WHITE_DIR", kind: "local_path", label: "", help: "", min: null, max: null, readonly: null,
  pattern: "^[A-Za-z]:\\\\[^\\s=/]*[^\\\\\\s=/]$", max_length: 200,
};
const tag: PolicyKey = {
  name: "PHOTON_SCANNER_TAG", kind: "semver", label: "", help: "", min: null, max: null, readonly: null,
  pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$", max_length: 32,
};

describe("checkPolicyValue — 서버와 같은 규칙으로 입력 칸에서 먼저 막는다", () => {
  it("숫자 범위", () => {
    expect(checkPolicyValue(uint(1, 300), "30")).toBeNull();
    expect(checkPolicyValue(uint(1, 300), "+30")).toBeNull();
    expect(checkPolicyValue(uint(1, 300), "0")).toBe("1~300 사이로 넣어 주세요");
    expect(checkPolicyValue(uint(1, 300), "1800")).toBe("1~300 사이로 넣어 주세요");
    expect(checkPolicyValue(uint(1, 300), "5s")).toBe("숫자만 넣어 주세요");
    expect(checkPolicyValue(uint(1, 300), "")).toBe("값을 넣어 주세요");
  });
  it("공백 · '=' · 끝 \\ 경로", () => {
    expect(checkPolicyValue(path, "C:\\INCA\\white")).toBeNull();
    expect(checkPolicyValue(path, "C:\\INCA\\my white")).toMatch(/공백/);
    expect(checkPolicyValue(path, "C:\\INCA\\white\\")).toMatch(/경로/);
    expect(checkPolicyValue(path, "C:/INCA/white")).toMatch(/경로/);
  });
  it("길이 상한", () => {
    expect(checkPolicyValue(path, "C:\\" + "a".repeat(200))).toBe("200자 이하로 넣어 주세요");
  });
  it("photon-scanner 태그는 0.0.10 이상", () => {
    expect(checkPolicyValue(tag, "0.0.10")).toBeNull();
    expect(checkPolicyValue(tag, "0.1.0")).toBeNull();
    expect(checkPolicyValue(tag, "0.0.9")).toMatch(/0\.0\.10 이상/);
    expect(checkPolicyValue(tag, "v0.0.10")).toMatch(/형식/);
  });
});

const policies: DaemonPolicies = {
  services: [
    { service: "NpRegiMal", host: "", policy_opt: "", updated_date: null, desc: null, parse_errors: [],
      values: { QUEUE_PATH: "C:\\INCA\\signature", BLACK_RATIO: "50" },
      keys: [{ ...path, name: "QUEUE_PATH" }, { ...uint(1, 100), name: "BLACK_RATIO" }] },
    { service: "NpSigExt", host: "", policy_opt: "", updated_date: null, desc: null, parse_errors: [],
      values: { QUEUE_DIR: "C:\\INCA\\signature", VT_DETECT_RATIO_BLACK: "50" },
      keys: [{ ...path, name: "QUEUE_DIR" }, { ...uint(1, 100), name: "VT_DETECT_RATIO_BLACK" }] },
  ],
  pairs: [
    { a: { service: "NpRegiMal", key: "QUEUE_PATH" }, b: { service: "NpSigExt", key: "QUEUE_DIR" } },
    { a: { service: "NpRegiMal", key: "BLACK_RATIO" }, b: { service: "NpSigExt", key: "VT_DETECT_RATIO_BLACK" } },
  ],
};

describe("editErrors — 짝 값은 같이 바꿔야 한다", () => {
  it("한쪽만 바꾸면 양쪽 칸에 오류", () => {
    const errs = editErrors(policies, { NpRegiMal: { QUEUE_PATH: "D:\\q" } });
    expect(errs["NpRegiMal.QUEUE_PATH"]).toMatch(/NpSigExt.QUEUE_DIR/);
    expect(errs["NpSigExt.QUEUE_DIR"]).toMatch(/NpRegiMal.QUEUE_PATH/);
  });
  it("둘 다 같은 값이면 통과, 숫자는 +60 = 60", () => {
    expect(editErrors(policies, { NpRegiMal: { QUEUE_PATH: "D:\\q" }, NpSigExt: { QUEUE_DIR: "D:\\q" } })).toEqual({});
    expect(editErrors(policies, { NpRegiMal: { BLACK_RATIO: "+60" }, NpSigExt: { VT_DETECT_RATIO_BLACK: "60" } })).toEqual({});
  });
});

describe("editList — 확인 창에 보일 바뀐 값 목록", () => {
  it("원래 값과 같은 편집은 빼고 '이전 → 새 값'", () => {
    expect(
      editList(policies, { NpRegiMal: { BLACK_RATIO: "50", QUEUE_PATH: "D:\\q" }, NpSigExt: {} }),
    ).toEqual([{ service: "NpRegiMal", key: "QUEUE_PATH", from: "C:\\INCA\\signature", to: "D:\\q" }]);
  });
});
