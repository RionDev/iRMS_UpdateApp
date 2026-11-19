import { QA_PICKUP } from "../constants";

/**
 * 정기 배포 시각 — photon-db policy_daemon NpPostmark.DEPLOY_TIME (postmark 0.0.0.2).
 * 형식은 postmark fnParseDeployTime: 시 1~2자리 0~23, 분 정확히 2자리. 하루 한 번, 그 시각부터 30분 창 안에서만 시작한다.
 * 같은 날 시각을 바꾸면 바뀐 시각의 창에서 한 번 더 돈다(하루 한 번 판정 키가 날짜 + 시각이고 메모리에만 있음).
 */

const HHMM = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
export const WINDOW_MIN = 30;
/** ptnbuild 빌드 → QC → archive 이동에 두는 여유 */
export const BUILD_GAP_MIN = 120;

export const AFTER_QA = `QA 수집(${QA_PICKUP}) 뒤입니다. 그날 패턴이 QA 에 늦게 넘어갑니다.`;
export const MAY_DEPLOY_AGAIN = "오늘 정기 배포가 이미 나갔습니다. 바꾼 시각의 30분 창이 아직 안 지나 오늘 한 번 더 배포될 수 있습니다.";
export const BUILD_TOO_CLOSE = (h: number) =>
  `ptnbuild 빌드 시각(${h}시)보다 2시간 이상 뒤가 아닙니다. 빌드 · QC 가 끝나기 전에 배포가 돌면 그날이 아닌 이전 회차 패턴이 나갑니다.`;

/** 'H:MM' · 'HH:MM' → 'HH:MM'. 형식이 아니면 null. */
export function normalizeDeployTime(v: string): string | null {
  const m = HHMM.exec(v);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function deployTimeWarnings(p: {
  time: string;
  buildHour: number | null;
  todayDeployedAt: string | null;
  now: Date;
  /** DEPLOY_TIME 을 이번에 바꿨는지(빌드 시각만 바꾼 경우 '한 번 더' 경고는 없음) */
  timeChanged: boolean;
}): string[] {
  const t = normalizeDeployTime(p.time);
  if (!t) return [];
  const out: string[] = [];
  if (t > QA_PICKUP) out.push(AFTER_QA);
  if (p.buildHour !== null && minutes(t) - p.buildHour * 60 < BUILD_GAP_MIN) out.push(BUILD_TOO_CLOSE(p.buildHour));
  const nowMin = p.now.getHours() * 60 + p.now.getMinutes();
  if (p.timeChanged && p.todayDeployedAt && nowMin < minutes(t) + WINDOW_MIN) out.push(MAY_DEPLOY_AGAIN);
  return out;
}
