import type { TableColumn } from "@common/components/BaseTable";
import { Button } from "@common/components/Button";
import { Input } from "@common/components/Input";
import { useFeatures } from "@common/hooks/useFeatures";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { PagedTable, staticNav } from "../components/PagedTable";
import { PageShell } from "../components/PageShell";
import { useLoadError } from "../hooks/useLoadError";
import { QA_PICKUP } from "../constants";
import { UPDATE_APP, UpdateFeature } from "../features";
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from "../services/updateService";
import type { ScheduleItem } from "../types/deploy";
import { InputError } from "../utils/error";
import { scheduleWarnings } from "../utils/schedule";

type Editing = { id: number | null; time: string };

export function SchedulePage() {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { can } = useFeatures(UPDATE_APP);
  const canEdit = can(UpdateFeature.SETTINGS);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [deployedAt, setDeployedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ScheduleItem | null>(null);
  const { error: loadError, track } = useLoadError();

  const load = useCallback(() => {
    setLoading(true);
    track(listSchedules())
      .then((p) => {
        setItems(p.items);
        setDeployedAt(p.today_schedule_deployed_at);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [track]);
  useEffect(load, [load]);

  const small = { height: "28px", padding: "0 10px", fontSize: theme.fontSize.sm };
  const columns: TableColumn<ScheduleItem>[] = [
    { key: "time", label: "배포 시각", render: (s) => <b style={{ fontFamily: "monospace", fontSize: theme.fontSize.lg }}>{s.time}</b> },
    ...(canEdit
      ? [
          {
            key: "actions",
            label: "",
            render: (s: ScheduleItem) => (
              <span style={{ display: "inline-flex", gap: "6px" }}>
                <Button type="button" variant="secondary" style={small} onClick={() => setEditing({ id: s.id, time: s.time })}>
                  수정
                </Button>
                <Button type="button" variant="secondary" style={small} onClick={() => setDeleting(s)} disabled={items.length <= 1}>
                  삭제
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ];

  const warnings = editing ? scheduleWarnings(editing.time, deployedAt, new Date()) : [];
  const timeOk = editing ? /^([01]\d|2[0-3]):[0-5]\d$/.test(editing.time) : false;

  return (
    <PageShell title="배포 시각">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: theme.fontSize.base, color: c.text, lineHeight: 1.6 }}>
          패턴류(자사 패턴 · BD 플러그인 · BFExcept.dat · bdcore) 정기 배포 시각입니다. QA 가 {QA_PICKUP} 에 가져갑니다.
          <br />
          <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>
            postmark 는 확인 주기마다 이 목록을 다시 읽고, 각 시각부터 30분 안에 한 번 배포합니다.
            {deployedAt && ` 오늘 정기 배포: ${deployedAt.slice(11, 16)}`}
          </span>
        </span>
        {canEdit && (
          <Button type="button" onClick={() => setEditing({ id: null, time: "" })}>
            + 시각 추가
          </Button>
        )}
      </div>
      <PagedTable nav={staticNav(items, loading)} columns={columns} rowKey={(s) => s.id} empty="배포 시각이 없습니다." error={loadError} />

      <ConfirmModal
        isOpen={editing !== null}
        title={editing?.id ? "배포 시각 수정" : "배포 시각 추가"}
        confirmLabel="저장"
        onClose={() => setEditing(null)}
        onConfirm={async () => {
          if (!editing) return;
          if (!timeOk) throw new InputError("시각을 HH:MM (00:00~23:59) 으로 넣어 주세요");
          if (editing.id) await updateSchedule(editing.id, editing.time);
          else await createSchedule(editing.time);
          load();
        }}
      >
        <Input
          id="schedule-time"
          type="time"
          label="시각 (HH:MM)"
          value={editing?.time ?? ""}
          onChange={(e) => editing && setEditing({ ...editing, time: e.target.value })}
        />
        {warnings.map((w) => (
          <p key={w} style={{ margin: "8px 0 0", color: c.warning, fontSize: theme.fontSize.sm }}>
            {w}
          </p>
        ))}
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleting !== null}
        title="배포 시각 삭제"
        confirmLabel="삭제"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteSchedule(deleting.id);
          load();
        }}
      >
        {deleting?.time} 정기 배포를 지웁니다.
      </ConfirmModal>
    </PageShell>
  );
}
