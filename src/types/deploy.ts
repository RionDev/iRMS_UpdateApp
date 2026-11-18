/** update_service 응답 타입 — BE src/schemas.py 와 같은 이름 · 필드. 시각은 'YYYY-MM-DD HH:MM:SS'. */
import type { Page } from "@common/types/pagination";

export interface SignalItem {
  id: number;
  project_id: number;
  project_name: string;
  tag: string;
  /** 1 READY 2 TAKEN 3 DONE 4 FAILED */
  status: number;
  message: string | null;
  /** postmark 가 GitLab 최신 태그로 처음 배포한 행(message='FIRST') */
  is_first: boolean;
  created_at: string;
  taken_at: string | null;
  done_at: string | null;
}

export interface CurrentItem {
  project_id: number;
  project_name: string;
  enabled: boolean;
  current_tag: string | null;
  current_is_first: boolean;
  current_done_at: string | null;
  latest_tag: string | null;
  latest_status: number | null;
  latest_created_at: string | null;
}

export interface LogItem {
  id: number;
  /** 1 SCHEDULE 2 SIGNAL 3 MANUAL */
  trigger: number;
  signal_id: number | null;
  request_id: number | null;
  inputs: string;
  /** 1 DONE 2 FAILED */
  result: number;
  reason: string | null;
  logged_at: string;
  signal_project_name: string | null;
  signal_tag: string | null;
}

export interface PatternRequestItem {
  id: number;
  /** 1 요청 2 빌드 중 3 배포 대기 4 배포 중 5 완료 6 실패 */
  status: number;
  force_build: boolean;
  requested_by: string | null;
  runs: string | null;
  message: string | null;
  created_at: string;
  build_at: string | null;
  ready_at: string | null;
  deploy_at: string | null;
  done_at: string | null;
}

export interface PatternRequestPage extends Page<PatternRequestItem> {
  /** 진행 중(1~4) 요청 id. 있으면 새 요청을 막는다 */
  active_id: number | null;
}

export interface TargetItem {
  project_id: number;
  project_name: string;
  module_name: string;
  windows_only: boolean;
  qc_package: boolean;
  enabled: boolean;
  /** READY 시그널 수 — 끄면 ENGINE_UNKNOWN 으로 실패할 건수 */
  ready_count: number;
}

export interface TargetCreate {
  project_id: number;
  project_name: string;
  module_name: string;
  windows_only: boolean;
  qc_package: boolean;
  enabled: boolean;
}

export type TargetUpdate = Partial<Pick<TargetItem, "module_name" | "windows_only" | "qc_package" | "enabled">>;

export interface ScheduleItem {
  id: number;
  /** HH:MM */
  time: string;
}

export interface SchedulePage extends Page<ScheduleItem> {
  /** 오늘 정기 배포가 이미 나갔으면 그 시각 */
  today_schedule_deployed_at: string | null;
}

export interface SignalFilters {
  project_name?: string;
  status?: number;
  kind?: "first" | "signal";
}

export interface LogFilters {
  trigger?: number;
  result?: number;
  date_from?: string;
  date_to?: string;
}
