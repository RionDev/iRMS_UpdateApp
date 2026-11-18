/**
 * 업데이트 앱 기능 키 — BE update_service src/features.py 와 같은 값.
 * 관리자가 admin 앱 → 앱 상세 → 기능 권한에서 기능별 최소 등급·허용 팀을 정한다.
 * 화면은 useFeatures(UPDATE_APP).can(키) 로 메뉴·버튼을 숨기고, 실제 차단은 BE 가 한다.
 */
export const UPDATE_APP = "/update";

export const UpdateFeature = {
  /** 배포 상태 조회 — 모든 화면 (처음 권한 Member~) */
  VIEW: "view",
  /** 패턴 수동 빌드·배포 요청 (Member~) */
  PATTERN_REQUEST: "pattern_request",
  /** 배포 설정 변경 — 배포 시각 · 배포 대상 (Lead~) */
  SETTINGS: "settings",
} as const;
