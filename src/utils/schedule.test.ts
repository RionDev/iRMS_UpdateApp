import { describe, expect, it } from "vitest";
import { AFTER_QA, MAY_DEPLOY_AGAIN, scheduleWarnings } from "./schedule";

const at = (hhmm: string) => new Date(`2026-11-19T${hhmm}:00`);

describe("scheduleWarnings", () => {
  it("12:00 이전이고 오늘 배포 전이면 경고 없음", () => {
    expect(scheduleWarnings("11:30", null, at("09:00"))).toEqual([]);
  });

  it("12:00 뒤 시각은 QA 수집 뒤 경고", () => {
    expect(scheduleWarnings("12:30", null, at("09:00"))).toEqual([AFTER_QA]);
    expect(scheduleWarnings("12:00", null, at("09:00"))).toEqual([]);
  });

  it("오늘 정기 배포가 나갔고 새 시각이 아직 안 지났으면 한 번 더 배포 경고", () => {
    expect(scheduleWarnings("11:50", "2026-11-19 11:30:04", at("11:40"))).toEqual([MAY_DEPLOY_AGAIN]);
  });

  it("새 시각이 이미 지났으면 오늘 다시 나가지 않음", () => {
    expect(scheduleWarnings("11:00", "2026-11-19 11:30:04", at("11:40"))).toEqual([]);
  });

  it("형식이 틀리면 경고 없음", () => {
    expect(scheduleWarnings("", "2026-11-19 11:30:04", at("11:40"))).toEqual([]);
  });
});
