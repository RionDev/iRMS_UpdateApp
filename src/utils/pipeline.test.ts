import { describe, expect, it } from "vitest";
import { pipelineMeta, pipelineTitle } from "./pipeline";

describe("pipelineMeta — 성공 · 실패만 눈에 띄게", () => {
  it("상태별 라벨 · 색", () => {
    expect(pipelineMeta("success")).toEqual({ label: "성공", tone: "success" });
    expect(pipelineMeta("failed")).toEqual({ label: "실패", tone: "danger" });
    expect(pipelineMeta("running")).toEqual({ label: "진행 중", tone: "warning" });
    expect(pipelineMeta("pending")).toEqual({ label: "진행 중", tone: "warning" });
    expect(pipelineMeta("canceled")).toEqual({ label: "취소", tone: "muted" });
    expect(pipelineMeta("skipped")).toEqual({ label: "건너뜀", tone: "muted" });
    expect(pipelineMeta("weird")).toEqual({ label: "weird", tone: "muted" });
  });
});

describe("pipelineTitle — 마우스를 올리면 보이는 설명", () => {
  it("실패면 버전과 실패한 job", () => {
    expect(
      pipelineTitle({ id: 811, status: "failed", ref: "master", created_at: "2026-11-18 14:00:00", version: "1.0.0.0", failed_jobs: ["qc-windows-x64"] }),
    ).toBe("master 파이프라인 #811 · 11-18 14:00 · 실패 1.0.0.0 — qc-windows-x64");
  });
  it("태그 파이프라인(7zip)", () => {
    expect(
      pipelineTitle({ id: 631, status: "success", ref: "23.01", created_at: "2026-10-01 09:00:00", version: null, failed_jobs: [] }),
    ).toBe("23.01 파이프라인 #631 · 10-01 09:00 · 성공");
  });
});
