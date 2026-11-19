import type { TableColumn } from "@common/components/BaseTable";
import { Button } from "@common/components/Button";
import { useFeatures } from "@common/hooks/useFeatures";
import { usePagedNav } from "@common/hooks/usePagedNav";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { PagedTable } from "../components/PagedTable";
import { PageShell } from "../components/PageShell";
import { useLoadError } from "../hooks/useLoadError";
import { StatusBadge } from "../components/StatusBadge";
import { REQUEST_POLL_MS, REQUEST_STATUS } from "../constants";
import { UPDATE_APP, UpdateFeature } from "../features";
import { createRequest, listRequests } from "../services/updateService";
import type { PatternRequestItem } from "../types/deploy";

const PAGE_SIZE = 20;

function short(t: string | null) {
  return t ? t.slice(5, 16) : "-";
}

export function RequestsPage() {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { can } = useFeatures(UPDATE_APP);
  const [force, setForce] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { error: loadError, track } = useLoadError();

  const fetcher = useCallback(
    async (cursor: string | undefined, snap: number | undefined, size: number) => {
      const page = await track(listRequests(cursor, snap, size));
      setActiveId(page.active_id);
      return page;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey, track],
  );
  const nav = usePagedNav<PatternRequestItem>({ fetcher, size: PAGE_SIZE, deps: [reloadKey] });

  // 진행 중인 요청 번호만 다시 읽는다 — 보고 있는 목록 페이지는 그대로 둔다
  const refreshActive = useCallback(
    () =>
      listRequests(undefined, undefined, 1)
        .then((p) => setActiveId(p.active_id))
        .catch(() => {}),
    [],
  );

  // 진행 중인 요청이 있는 동안만 15초마다 다시 읽는다.
  // 1페이지(최근 요청)를 보고 있으면 목록째, 다른 페이지를 보고 있으면 그 페이지를 두고 진행 상태만.
  const pageRef = useRef(nav.page);
  pageRef.current = nav.page;
  useEffect(() => {
    if (activeId === null) return;
    const t = window.setInterval(() => {
      if (pageRef.current === 1) setReloadKey((k) => k + 1);
      else void refreshActive();
    }, REQUEST_POLL_MS);
    return () => window.clearInterval(t);
  }, [activeId, refreshActive]);

  const columns: TableColumn<PatternRequestItem>[] = [
    { key: "id", label: "#" },
    { key: "requested_by", label: "요청자", render: (r) => r.requested_by ?? "-" },
    {
      key: "status",
      label: "상태",
      render: (r) => (
        <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
          <StatusBadge meta={REQUEST_STATUS[r.status]} />
          {r.force_build && <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>force</span>}
        </span>
      ),
    },
    { key: "created_at", label: "요청", render: (r) => short(r.created_at) },
    { key: "build_at", label: "빌드 시작", render: (r) => short(r.build_at) },
    { key: "ready_at", label: "배포 대기", render: (r) => short(r.ready_at) },
    { key: "deploy_at", label: "배포 시작", render: (r) => short(r.deploy_at) },
    { key: "done_at", label: "끝", render: (r) => short(r.done_at) },
    {
      key: "runs",
      label: "회차",
      render: (r) => <span style={{ fontFamily: "monospace", fontSize: theme.fontSize.sm }}>{r.runs ?? "-"}</span>,
    },
    {
      key: "message",
      label: "사유",
      render: (r) => (r.status === 6 && r.message ? <span style={{ color: c.danger }}>{r.message}</span> : "-"),
    },
  ];

  return (
    <PageShell title="패턴 수동 요청">
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "14px 16px",
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadow.card,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: "260px", fontSize: theme.fontSize.base, color: c.text, lineHeight: 1.6 }}>
          그날 바로 낼 패턴을 요청합니다. ptnbuild 가 빌드 · QC 를 하고, 통과하면 postmark 가 배포합니다.
          <br />
          <span style={{ color: c.textMuted, fontSize: theme.fontSize.sm }}>
            정기 배포는 배포 시각 화면의 시각에 자동으로 나갑니다.
          </span>
        </div>
        {can(UpdateFeature.PATTERN_REQUEST) && (
          <>
            <label style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: theme.fontSize.base }}>
              <input
                id="force-build"
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                disabled={activeId !== null}
              />
              전량 예외 청크 승인(force)
            </label>
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={activeId !== null}>
              빌드 · 배포 요청
            </Button>
          </>
        )}
        {activeId !== null && (
          <span role="status" style={{ width: "100%", fontSize: theme.fontSize.sm, color: c.warning }}>
            요청 #{activeId} 진행 중 — 끝날 때까지 새 요청을 받지 않습니다. (15초마다 새로 읽음)
          </span>
        )}
      </div>
      <PagedTable nav={nav} columns={columns} rowKey={(r) => r.id} empty="요청이 없습니다." error={loadError} />
      <ConfirmModal
        isOpen={confirmOpen}
        title="패턴 빌드 · 배포 요청"
        confirmLabel="요청"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await createRequest(force);
          } catch (e) {
            // 그 사이 다른 사람이 요청했으면(409) 진행 중 번호를 다시 읽어 버튼을 막는다
            void refreshActive();
            throw e;
          }
          setForce(false);
          setReloadKey((k) => k + 1);
        }}
      >
        지금 패턴을 빌드하고 QC 를 통과하면 바로 배포합니다.
        {force && (
          <p style={{ margin: "8px 0 0", color: c.warning }}>
            force: 전량 예외 청크를 빼고 진행합니다 (ptnbuild build --force 와 같음).
          </p>
        )}
      </ConfirmModal>
    </PageShell>
  );
}
