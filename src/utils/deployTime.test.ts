import { describe, expect, it } from "vitest";
import { AFTER_QA, BUILD_TOO_CLOSE, MAY_DEPLOY_AGAIN, deployTimeWarnings, normalizeDeployTime } from "./deployTime";

const at = (hhmm: string) => new Date(`2026-11-19T${hhmm}:00`);
const w = (time: string, opts: { build?: number | null; deployed?: string | null; now?: string; changed?: boolean } = {}) =>
  deployTimeWarnings({
    time,
    buildHour: opts.build === undefined ? 9 : opts.build,
    todayDeployedAt: opts.deployed ?? null,
    now: at(opts.now ?? "08:00"),
    timeChanged: opts.changed ?? true,
  });

describe("normalizeDeployTime — postmark fnParseDeployTime 과 같은 형식", () => {
  it.each([
    ["9:30", "09:30"],
    ["09:30", "09:30"],
    ["0:00", "00:00"],
    ["23:59", "23:59"],
  ])("%s → %s", (v, out) => expect(normalizeDeployTime(v)).toBe(out));

  it.each(["24:00", "11:3", "011:30", "11:30:00", "11.30", "", " 11:30"])("%s 는 형식 아님", (v) =>
    expect(normalizeDeployTime(v)).toBeNull(),
  );
});

describe("deployTimeWarnings — 막지는 않는 경고", () => {
  it("빌드 9시 · 배포 11:30 · 오늘 배포 전이면 경고 없음", () => {
    expect(w("11:30")).toEqual([]);
  });

  it("QA 수집 12:00 뒤", () => {
    expect(w("12:30")).toEqual([AFTER_QA]);
    expect(w("12:00")).toEqual([]);
  });

  it("빌드 시각과 2시간이 안 되거나 빌드보다 앞서면", () => {
    expect(w("10:59", { build: 9 })).toEqual([BUILD_TOO_CLOSE(9)]);
    expect(w("11:00", { build: 9 })).toEqual([]);
    expect(w("08:00", { build: 9 })).toEqual([BUILD_TOO_CLOSE(9)]);
    expect(w("9:00", { build: null })).toEqual([]); // BUILD_HOUR 를 못 읽으면 판단하지 않음
  });

  it("오늘 정기 배포가 나갔고 바뀐 시각의 30분 창이 아직 안 끝났으면 한 번 더 배포", () => {
    expect(w("11:50", { deployed: "2026-11-19 11:30:04", now: "11:40" })).toEqual([MAY_DEPLOY_AGAIN]);
    expect(w("11:20", { deployed: "2026-11-19 11:30:04", now: "11:40" })).toEqual([MAY_DEPLOY_AGAIN]); // 11:20~11:50 창 안
    expect(w("11:00", { deployed: "2026-11-19 11:30:04", now: "11:40" })).toEqual([]); // 창 11:00~11:30 이미 지남
  });

  it("시각을 바꾸지 않았으면(빌드 시각만 바꿈) 한 번 더 배포 경고는 없음", () => {
    expect(w("11:50", { deployed: "2026-11-19 11:30:04", now: "11:40", changed: false })).toEqual([]);
  });

  it("형식이 틀리면 경고 없음(형식 오류는 칸 검사가 알림)", () => {
    expect(w("25:00")).toEqual([]);
  });
});
