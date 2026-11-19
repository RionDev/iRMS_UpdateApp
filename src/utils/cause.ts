import type { LogItem } from "../types/deploy";

/**
 * ptnbuild 0.0.0.6 부터 156 명령줄 빌드(ptnbuild build)도 pattern_request 에 행을 남긴다(status 2 부터 시작).
 * 웹 요청과는 requested_by 값 하나로만 구분한다 — ptnbuild include/define/NpPtnRequestDef.h REQUEST_BY_CLI 와 같아야 한다.
 */
export const REQUEST_BY_CLI = "ptnbuild build";

export function isCliRequest(requestedBy: string | null): boolean {
  return requestedBy === REQUEST_BY_CLI;
}

/** 요청 목록의 요청자 칸 */
export function requesterLabel(requestedBy: string | null): string {
  if (isCliRequest(requestedBy)) return "서버 수동 빌드";
  return requestedBy ?? "-";
}

/** 배포 기록 한 줄을 일으킨 것 */
export function logCause(
  l: Pick<LogItem, "trigger" | "signal_id" | "request_id" | "signal_project_name" | "signal_tag" | "request_requested_by">,
): string {
  if (l.trigger === 2) return l.signal_project_name ? `시그널 ${l.signal_project_name} ${l.signal_tag}` : `시그널 #${l.signal_id ?? "-"}`;
  if (l.trigger === 3) {
    if (!l.request_id) return "156 에서 직접 배포";
    if (isCliRequest(l.request_requested_by)) return `서버 수동 빌드 #${l.request_id}`;
    return `웹 수동 요청 #${l.request_id}${l.request_requested_by ? ` · ${l.request_requested_by}` : ""}`;
  }
  return "정기 배포";
}
