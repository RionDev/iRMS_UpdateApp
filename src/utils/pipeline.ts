import type { StatusMeta } from "../constants";
import type { PipelineInfo } from "../types/deploy";

const META: Record<string, StatusMeta> = {
  success: { label: "성공", tone: "success" },
  failed: { label: "실패", tone: "danger" },
  canceled: { label: "취소", tone: "muted" },
  skipped: { label: "건너뜀", tone: "muted" },
  manual: { label: "수동 대기", tone: "muted" },
  scheduled: { label: "예약", tone: "muted" },
};
const RUNNING = new Set(["created", "waiting_for_resource", "preparing", "pending", "running"]);

/** GitLab 파이프라인 status → 라벨 · 색 */
export function pipelineMeta(status: string): StatusMeta {
  if (RUNNING.has(status)) return { label: "진행 중", tone: "warning" };
  return META[status] ?? { label: status, tone: "muted" };
}

/** 'master 파이프라인 #811 · 11-18 14:00 · 실패 1.0.0.0 — qc-windows-x64' */
export function pipelineTitle(p: PipelineInfo): string {
  const when = p.created_at ? ` · ${p.created_at.slice(5, 16)}` : "";
  let s = `${p.ref ?? ""} 파이프라인 #${p.id}${when} · ${pipelineMeta(p.status).label}`;
  if (p.status === "failed") {
    if (p.version) s += ` ${p.version}`;
    if (p.failed_jobs.length) s += ` — ${p.failed_jobs.join(", ")}`;
  }
  return s;
}
