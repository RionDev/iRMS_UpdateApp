import apiClient from "@common/services/apiClient";
import type { Page } from "@common/types/pagination";
import type {
  CurrentItem,
  DaemonPolicies,
  PipelineList,
  PolicyEdits,
  LogFilters,
  LogItem,
  PatternRequestItem,
  PatternRequestPage,
  ScheduleStatus,
  SignalFilters,
  SignalItem,
  TargetCheck,
  TargetCreate,
  TargetItem,
  TargetUpdate,
} from "../types/deploy";

const BASE = "/api/update";

// ──── 조회 ────
export async function listSignals(
  f: SignalFilters,
  cursor?: string,
  snapshotIdx?: number,
  size = 50,
): Promise<Page<SignalItem>> {
  const res = await apiClient.get<Page<SignalItem>>(`${BASE}/signals`, {
    params: { ...f, cursor, snapshot_idx: snapshotIdx, size },
  });
  return res.data;
}

export async function listCurrent(): Promise<Page<CurrentItem>> {
  return (await apiClient.get<Page<CurrentItem>>(`${BASE}/signals/current`)).data;
}

export async function listLogs(
  f: LogFilters,
  cursor?: string,
  snapshotIdx?: number,
  size = 50,
): Promise<Page<LogItem>> {
  const res = await apiClient.get<Page<LogItem>>(`${BASE}/logs`, {
    params: { ...f, cursor, snapshot_idx: snapshotIdx, size },
  });
  return res.data;
}

export async function listRequests(cursor?: string, snapshotIdx?: number, size = 50): Promise<PatternRequestPage> {
  const res = await apiClient.get<PatternRequestPage>(`${BASE}/pattern-requests`, {
    params: { cursor, snapshot_idx: snapshotIdx, size },
  });
  return res.data;
}

export async function listTargets(): Promise<Page<TargetItem>> {
  return (await apiClient.get<Page<TargetItem>>(`${BASE}/targets`)).data;
}

export async function getSchedule(): Promise<ScheduleStatus> {
  return (await apiClient.get<ScheduleStatus>(`${BASE}/schedule`)).data;
}

// ──── 쓰기 ────
export async function createRequest(): Promise<PatternRequestItem> {
  return (await apiClient.post<PatternRequestItem>(`${BASE}/pattern-requests`)).data;
}

export async function createTarget(body: TargetCreate): Promise<TargetItem> {
  return (await apiClient.post<TargetItem>(`${BASE}/targets`, body)).data;
}

export async function updateTarget(projectId: number, body: TargetUpdate): Promise<TargetItem> {
  return (await apiClient.put<TargetItem>(`${BASE}/targets/${projectId}`, body)).data;
}

/** GitLab 확인만 (바꾸지 않음) */
export async function checkTarget(projectId: number): Promise<TargetCheck> {
  return (await apiClient.post<TargetCheck>(`${BASE}/targets/${projectId}/check`)).data;
}

export async function listDaemonPolicies(): Promise<DaemonPolicies> {
  return (await apiClient.get("/api/update/daemon-policies")).data;
}

export async function updateDaemonPolicies(changes: PolicyEdits): Promise<DaemonPolicies> {
  return (await apiClient.put("/api/update/daemon-policies", { changes })).data;
}

export async function listPipelines(): Promise<PipelineList> {
  return (await apiClient.get("/api/update/pipelines")).data;
}
