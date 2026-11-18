/** 상태값 숫자 → 화면 라벨 · 색. 숫자 뜻은 iRMS_DB irms-db/ddl/14-deploy.sql COMMENT 와 같다. */
export type Tone = "info" | "warning" | "success" | "danger" | "muted";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const SIGNAL_STATUS: Record<number, StatusMeta> = {
  1: { label: "READY", tone: "info" },
  2: { label: "TAKEN", tone: "warning" },
  3: { label: "DONE", tone: "success" },
  4: { label: "FAILED", tone: "danger" },
};

export const FIRST_BADGE: StatusMeta = { label: "FIRST", tone: "muted" };
export const FIRST_TITLE = "QC 도입 전 태그로 처음 배포한 기록 (postmark 가 GitLab 최신 태그로 배포)";

export const REQUEST_STATUS: Record<number, StatusMeta> = {
  1: { label: "요청", tone: "muted" },
  2: { label: "빌드 중", tone: "warning" },
  3: { label: "배포 대기", tone: "info" },
  4: { label: "배포 중", tone: "warning" },
  5: { label: "완료", tone: "success" },
  6: { label: "실패", tone: "danger" },
};

export const LOG_TRIGGER: Record<number, StatusMeta> = {
  1: { label: "정시", tone: "muted" },
  2: { label: "시그널", tone: "info" },
  3: { label: "수동", tone: "warning" },
};

export const LOG_RESULT: Record<number, StatusMeta> = {
  1: { label: "DONE", tone: "success" },
  2: { label: "FAILED", tone: "danger" },
};

/** 진행 중이면 화면을 15초마다 다시 읽는다 (패턴 수동 요청) */
export const REQUEST_POLL_MS = 15_000;

/** QA 가 publish 폴더를 가져가는 시각 */
export const QA_PICKUP = "12:00";
