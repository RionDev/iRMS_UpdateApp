import apiClient from "@common/services/apiClient";
import type { Page } from "@common/types/pagination";
import type {
  CurrentItem,
  DaemonPolicies,
  PolicyEdits,
  LogFilters,
  LogItem,
  PatternRequestItem,
  PatternRequestPage,
  ScheduleItem,
  SchedulePage,
  SignalFilters,
  SignalItem,
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

export async function listSchedules(): Promise<SchedulePage> {
  return (await apiClient.get<SchedulePage>(`${BASE}/schedules`)).data;
}

// ──── 쓰기 ────
export async function createRequest(forceBuild: boolean): Promise<PatternRequestItem> {
  return (await apiClient.post<PatternRequestItem>(`${BASE}/pattern-requests`, { force_build: forceBuild })).data;
}

export async function createTarget(body: TargetCreate): Promise<TargetItem> {
  return (await apiClient.post<TargetItem>(`${BASE}/targets`, body)).data;
}

export async function updateTarget(projectId: number, body: TargetUpdate): Promise<TargetItem> {
  return (await apiClient.put<TargetItem>(`${BASE}/targets/${projectId}`, body)).data;
}

export async function createSchedule(time: string): Promise<ScheduleItem> {
  return (await apiClient.post<ScheduleItem>(`${BASE}/schedules`, { time })).data;
}

export async function updateSchedule(id: number, time: string): Promise<ScheduleItem> {
  return (await apiClient.put<ScheduleItem>(`${BASE}/schedules/${id}`, { time })).data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/schedules/${id}`);
}

export async function listDaemonPolicies(): Promise<DaemonPolicies> {
  return (await apiClient.get("/api/update/daemon-policies")).data;
}

export async function updateDaemonPolicies(changes: PolicyEdits): Promise<DaemonPolicies> {
  return (await apiClient.put("/api/update/daemon-policies", { changes })).data;
}
