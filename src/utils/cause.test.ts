import { describe, expect, it } from "vitest";
import { isCliRequest, logCause, requesterLabel } from "./cause";

const log = (o: Partial<Parameters<typeof logCause>[0]>) => ({
  trigger: 3,
  signal_id: null,
  request_id: null,
  signal_project_name: null,
  signal_tag: null,
  request_requested_by: null,
  ...o,
});

describe("logCause — 배포를 일으킨 것", () => {
  it("156 명령줄 빌드(ptnbuild build)는 웹 요청과 구분", () => {
    expect(logCause(log({ request_id: 1, request_requested_by: "ptnbuild build" }))).toBe("서버 수동 빌드 #1");
  });
  it("웹 요청은 요청자 이름과 함께", () => {
    expect(logCause(log({ request_id: 3, request_requested_by: "전상연" }))).toBe("웹 수동 요청 #3 · 전상연");
    expect(logCause(log({ request_id: 3 }))).toBe("웹 수동 요청 #3");
  });
  it("요청 없이 156 에서 postmark 를 직접 돌린 배포", () => {
    expect(logCause(log({}))).toBe("156 에서 직접 배포");
  });
  it("정시 · 시그널", () => {
    expect(logCause(log({ trigger: 1 }))).toBe("정기 배포");
    expect(logCause(log({ trigger: 2, signal_id: 28, signal_project_name: "ixtebd", signal_tag: "1.0.0.0" }))).toBe("시그널 ixtebd 1.0.0.0");
  });
});

describe("요청 목록 — requested_by 값 하나로만 판별", () => {
  it("'ptnbuild build' 만 명령줄 빌드", () => {
    expect(isCliRequest("ptnbuild build")).toBe(true);
    expect(isCliRequest("ptnbuild")).toBe(false);
    expect(isCliRequest(null)).toBe(false);
  });
  it("요청자 칸 표시", () => {
    expect(requesterLabel("ptnbuild build")).toBe("서버 수동 빌드");
    expect(requesterLabel("전상연")).toBe("전상연");
    expect(requesterLabel(null)).toBe("-");
  });
});
