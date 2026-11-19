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
  /** 바로 앞 성공(DONE) 배포의 inputs — 바뀐 것 비교용 */
  prev_inputs: string | null;
  /** request_id 의 requested_by — 'ptnbuild build' 면 156 명령줄 빌드 */
  request_requested_by: string | null;
}

export interface PatternRequestItem {
  id: number;
  /** 1 요청 2 빌드 중 3 배포 대기 4 배포 중 5 완료 6 실패 */
  status: number;
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

/** 새 대상은 늘 꺼진 채로 들어간다 — 켜기는 GitLab 확인을 거친 updateTarget 으로만 */
export interface TargetCreate {
  project_id: number;
  project_name: string;
  module_name: string;
  windows_only: boolean;
  qc_package: boolean;
}

/** postmark 가 이 대상을 배포할 때 받을 버전 · zip · bin/<module> 을 미리 받아 본 결과 */
export interface TargetCheck {
  ok: boolean;
  tag: string | null;
  /** DONE 행이 없어 FIRST(GitLab 최근 패키지)로 고른 버전인지 */
  first: boolean;
  problems: string[];
}

export type TargetUpdate = Partial<Pick<TargetItem, "module_name" | "windows_only" | "qc_package" | "enabled">>;

/** 정기 배포 시각 — photon-db policy_daemon NpPostmark.DEPLOY_TIME */
export interface ScheduleStatus {
  /** HH:MM. 못 읽으면 null(이유는 error) */
  deploy_time: string | null;
  /** 오늘 정기 배포가 이미 나갔으면 그 시각 */
  today_schedule_deployed_at: string | null;
  error: string | null;
}

export interface SignalFilters {
  project_name?: string;
  status?: number;
  kind?: "first" | "signal";
}

export interface LogFilters {
  /** engine = 시그널 배포, pattern = 정시 · 수동 배포 */
  kind?: "engine" | "pattern";
  trigger?: number;
  result?: number;
  date_from?: string;
  date_to?: string;
}

// ──── 데몬 정책 (photon-db.policy_daemon) ────

export type PolicyKind = "uint" | "local_path" | "unc_path" | "ipv4" | "hhmm";

export interface PolicyKey {
  name: string;
  kind: PolicyKind;
  label: string;
  /** 뜻 · 반영 시점 · 틀리면 생기는 일 */
  help: string;
  min: number | null;
  max: number | null;
  /** 바꿀 수 없는 이유 (있으면 읽기 전용) */
  readonly: string | null;
  pattern: string | null;
  max_length: number | null;
}

export interface DaemonPolicy {
  service: string;
  host: string;
  policy_opt: string | null;
  updated_date: string | null;
  desc: string | null;
  values: Record<string, string>;
  /** 있으면 그 데몬은 웹에서 못 고침 */
  parse_errors: string[];
  keys: PolicyKey[];
}

/** 배포 데몬 3개(NpPtnBuild · NpPostmark · NpBdUpdate). 250 샘플 데몬은 샘플 앱 몫 */
export interface DaemonPolicies {
  services: DaemonPolicy[];
}

/** { 서비스: { 키: 새 값 } } */
export type PolicyEdits = Record<string, Record<string, string>>;

// ──── GitLab 파이프라인 ────

export interface PipelineInfo {
  id: number;
  status: string;
  /** master, 또는 master 파이프라인이 없는 프로젝트(7zip)는 태그 */
  ref: string | null;
  created_at: string | null;
  /** 실패일 때만 — CMakeLists PROJECT_VERSION */
  version: string | null;
  failed_jobs: string[];
}

export interface PipelineItem {
  project_id: number;
  project_name: string;
  pipeline: PipelineInfo | null;
  error: string | null;
}

export interface PipelineList {
  available: boolean;
  reason: string | null;
  items: PipelineItem[];
}
