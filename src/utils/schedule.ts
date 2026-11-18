import { QA_PICKUP } from "../constants";

export const AFTER_QA = `QA 수집(${QA_PICKUP}) 뒤입니다. 그날 패턴이 QA 에 늦게 넘어갑니다.`;
export const MAY_DEPLOY_AGAIN =
  "오늘 정기 배포가 이미 나갔습니다. 이 시각으로 바꾸면 오늘 한 번 더 배포될 수 있습니다.";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * 배포 시각 저장 전 경고(막지는 않음).
 * - QA 수집 시각 뒤
 * - postmark 중복 방지 키가 (날짜, 시, 분)이고 메모리에만 있어, 오늘 이미 배포한 뒤 아직 안 지난 시각으로 바꾸면 한 번 더 나간다
 */
export function scheduleWarnings(time: string, todayDeployedAt: string | null, now: Date): string[] {
  if (!HHMM.test(time)) return [];
  const out: string[] = [];
  if (time > QA_PICKUP) out.push(AFTER_QA);
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (todayDeployedAt && time > nowHHMM) out.push(MAY_DEPLOY_AGAIN);
  return out;
}
