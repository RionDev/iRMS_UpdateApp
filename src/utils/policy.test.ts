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
const deployTime: PolicyKey = {
  name: "DEPLOY_TIME", kind: "hhmm", label: "", help: "", min: null, max: null, readonly: null,
  pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", max_length: 5,
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
  it("정기 배포 시각은 H:MM · HH:MM (postmark fnParseDeployTime)", () => {
    expect(checkPolicyValue(deployTime, "11:30")).toBeNull();
    expect(checkPolicyValue(deployTime, "9:30")).toBeNull();
    expect(checkPolicyValue(deployTime, "24:00")).toMatch(/HH:MM/);
    expect(checkPolicyValue(deployTime, "11:3")).toMatch(/HH:MM/);
  });
});

const policies: DaemonPolicies = {
  services: [
    { service: "NpPostmark", host: "", policy_opt: "", updated_date: null, desc: null, parse_errors: [],
      values: { CHECK_SEC: "30", DEPLOY_TIME: "11:30" },
      keys: [uint(1, 300), deployTime] },
    { service: "NpPtnBuild", host: "", policy_opt: "", updated_date: null, desc: null, parse_errors: [],
      values: { WHITE_DIR: "C:\\INCA\\white" },
      keys: [path] },
  ],
};

describe("editErrors — 칸마다 검사", () => {
  it("틀린 칸만 오류", () => {
    const errs = editErrors(policies, { NpPostmark: { CHECK_SEC: "0", DEPLOY_TIME: "9:30" }, NpPtnBuild: { WHITE_DIR: "x" } });
    expect(Object.keys(errs).sort()).toEqual(["NpPostmark.CHECK_SEC", "NpPtnBuild.WHITE_DIR"]);
  });
});

describe("editList — 확인 창에 보일 바뀐 값 목록", () => {
  it("원래 값과 같은 편집(+30 = 30, 9:30 ≠ 11:30, 11:30 = 11:30)은 빼고 '이전 → 새 값'", () => {
    expect(
      editList(policies, { NpPostmark: { CHECK_SEC: "+30", DEPLOY_TIME: "9:30" }, NpPtnBuild: {} }),
    ).toEqual([{ service: "NpPostmark", key: "DEPLOY_TIME", from: "11:30", to: "9:30" }]);
    expect(editList(policies, { NpPostmark: { DEPLOY_TIME: "11:30" } })).toEqual([]);
  });
});
