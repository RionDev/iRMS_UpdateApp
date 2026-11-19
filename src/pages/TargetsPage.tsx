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
import { UPDATE_APP, UpdateFeature } from "../features";
import { checkTarget, createTarget, listTargets, updateTarget } from "../services/updateService";
import type { TargetCheck, TargetCreate, TargetItem } from "../types/deploy";
import { errorMessage, InputError } from "../utils/error";

const EMPTY_FORM = { project_id: "", project_name: "", module_name: "", windows_only: false, qc_package: true };

function Check({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function TargetsPage() {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { can } = useFeatures(UPDATE_APP);
  const canEdit = can(UpdateFeature.SETTINGS);
  const [items, setItems] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<TargetItem | null>(null);
  const [editForm, setEditForm] = useState({ module_name: "", windows_only: false, qc_package: true });
  const [toggling, setToggling] = useState<TargetItem | null>(null);
  // 켜기 전 GitLab 확인 결과 — postmark 가 FIRST · 배포 때 받을 것과 같은 규칙(BE target_check)
  const [check, setCheck] = useState<{ result: TargetCheck | null; error: string | null; loading: boolean }>({
    result: null,
    error: null,
    loading: false,
  });
  const { error: loadError, track } = useLoadError();

  const load = useCallback(() => {
    setLoading(true);
    track(listTargets())
      .then((p) => setItems(p.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [track]);
  useEffect(load, [load]);

  const yes = (v: boolean) => (v ? "✓" : "-");
  const columns: TableColumn<TargetItem>[] = [
    { key: "project_id", label: "project_id" },
    { key: "project_name", label: "이름", render: (t) => <b style={{ fontWeight: 600 }}>{t.project_name}</b> },
    { key: "module_name", label: "모듈 파일", render: (t) => <span style={{ fontFamily: "monospace" }}>{t.module_name}</span> },
    { key: "windows_only", label: "Windows 전용", render: (t) => yes(t.windows_only) },
    { key: "qc_package", label: "QC 패키지", render: (t) => yes(t.qc_package) },
    {
      key: "enabled",
      label: "사용",
      render: (t) =>
        canEdit ? (
          <span onClick={(e) => e.stopPropagation()}>
            <input
              id={`enabled-${t.project_id}`}
              type="checkbox"
              aria-label={`${t.project_name} 사용`}
              checked={t.enabled}
              onChange={() => openToggle(t)}
            />
          </span>
        ) : (
          <span style={{ color: t.enabled ? c.success : c.textMuted }}>{t.enabled ? "사용" : "꺼짐"}</span>
        ),
    },
    { key: "ready_count", label: "READY 시그널", render: (t) => t.ready_count || "-" },
  ];

  // 끄기 창의 READY 건수는 창을 여는 순간 다시 읽는다 — 화면을 연 뒤 autoflow 가 남긴 신호도 경고에 넣기 위해.
  // 켜기 창은 열자마자 GitLab 확인을 돌려 결과를 보여 주고, 통과 못 하면 켜기 버튼을 막는다(서버도 다시 확인한다).
  const openToggle = async (t: TargetItem) => {
    let cur = t;
    try {
      const fresh = (await listTargets()).items;
      setItems(fresh);
      cur = fresh.find((x) => x.project_id === t.project_id) ?? t;
    } catch {
      /* 목록을 못 읽어도 창은 연다 */
    }
    setToggling(cur);
    if (cur.enabled) return;
    setCheck({ result: null, error: null, loading: true });
    try {
      setCheck({ result: await checkTarget(cur.project_id), error: null, loading: false });
    } catch (e) {
      setCheck({ result: null, error: errorMessage(e), loading: false });
    }
  };

  const openEdit = (t: TargetItem) => {
    if (!canEdit) return;
    setEditing(t);
    setEditForm({ module_name: t.module_name, windows_only: t.windows_only, qc_package: t.qc_package });
  };

  const formValid =
    /^\d+$/.test(form.project_id) && Number(form.project_id) > 0 && form.project_name.trim() && form.module_name.trim();

  return (
    <PageShell title="배포 대상">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: theme.fontSize.base, color: c.textMuted }}>
          엔진류(엔진 · 7zip) 배포 대상. autoflow 는 여기 켜진 엔진만 배포 신호를 남기고, postmark 는 켜진 엔진만 배포 트리에 넣습니다.
        </span>
        {canEdit && (
          <Button type="button" onClick={() => setAdding(true)}>
            + 대상 추가
          </Button>
        )}
      </div>
      <PagedTable
        nav={staticNav(items, loading)}
        columns={columns}
        rowKey={(t) => t.project_id}
        onRowClick={canEdit ? openEdit : undefined}
        empty="배포 대상이 없습니다."
        error={loadError}
      />

      <ConfirmModal
        isOpen={adding}
        title="배포 대상 추가"
        confirmLabel="추가"
        onClose={() => {
          setAdding(false);
          setForm(EMPTY_FORM);
        }}
        onConfirm={async () => {
          if (!formValid) throw new InputError("project_id(양의 정수) · 이름 · 모듈 파일을 모두 넣어 주세요");
          const body: TargetCreate = {
            project_id: Number(form.project_id),
            project_name: form.project_name.trim(),
            module_name: form.module_name.trim(),
            windows_only: form.windows_only,
            qc_package: form.qc_package,
          };
          await createTarget(body);
          setForm(EMPTY_FORM);
          load();
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Input id="t-pid" label="GitLab project_id" inputMode="numeric" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} />
          <Input id="t-name" label="GitLab 프로젝트 이름" maxLength={64} value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
          <Input id="t-module" label="트리 안 모듈 파일 이름 (확장자 제외)" maxLength={64} value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} />
          <Check id="t-win" label="Windows 전용 (TLX6.0 에 넣지 않음)" checked={form.windows_only} onChange={(v) => setForm({ ...form, windows_only: v })} />
          <Check id="t-qc" label="패턴 QC 엔진 패키지에도 넣음" checked={form.qc_package} onChange={(v) => setForm({ ...form, qc_package: v })} />
          {!formValid && <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>project_id(양의 정수) · 이름 · 모듈 파일을 모두 넣어 주세요.</span>}
          <span style={{ fontSize: theme.fontSize.sm, color: c.warning, lineHeight: 1.6 }}>
            꺼진 채로 추가합니다. 추가한 뒤 '사용'을 켜면 GitLab 에서 패키지 · zip · 모듈 파일을 먼저 받아 보고, 통과해야 켜집니다.
            project_id · 이름은 추가한 뒤 바꿀 수 없습니다.
          </span>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={editing !== null}
        title={editing ? `${editing.project_name} 수정` : ""}
        confirmLabel="저장"
        onClose={() => setEditing(null)}
        onConfirm={async () => {
          if (!editing) return;
          if (!editForm.module_name.trim()) throw new InputError("모듈 파일 이름을 넣어 주세요");
          await updateTarget(editing.project_id, {
            module_name: editForm.module_name.trim(),
            windows_only: editForm.windows_only,
            qc_package: editForm.qc_package,
          });
          load();
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Input id="e-module" label="트리 안 모듈 파일 이름" maxLength={64} value={editForm.module_name} onChange={(e) => setEditForm({ ...editForm, module_name: e.target.value })} />
          {editing && editForm.module_name.trim() !== editing.module_name && (
            <span style={{ color: c.warning, fontSize: theme.fontSize.sm }}>다음 배포부터 트리 안 파일 이름이 바뀝니다.</span>
          )}
          {editing?.enabled &&
            (editForm.module_name.trim() !== editing.module_name || editForm.windows_only !== editing.windows_only) && (
              <span style={{ color: c.textMuted, fontSize: theme.fontSize.sm }}>
                켜진 대상이라 저장할 때 GitLab 에서 zip · 모듈 파일을 먼저 받아 봅니다. 없으면 저장하지 않습니다(틀리면 postmark 배포 전체가 멈춤).
              </span>
            )}
          <Check id="e-win" label="Windows 전용 (TLX6.0 에 넣지 않음)" checked={editForm.windows_only} onChange={(v) => setEditForm({ ...editForm, windows_only: v })} />
          <Check id="e-qc" label="패턴 QC 엔진 패키지에도 넣음" checked={editForm.qc_package} onChange={(v) => setEditForm({ ...editForm, qc_package: v })} />
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={toggling !== null}
        title={toggling ? `${toggling.project_name} ${toggling.enabled ? "끄기" : "켜기"}` : ""}
        confirmLabel={toggling?.enabled ? "끄기" : "켜기"}
        confirmDisabled={!toggling?.enabled && !check.result?.ok}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          if (!toggling) return;
          await updateTarget(toggling.project_id, { enabled: !toggling.enabled });
          load();
        }}
      >
        {toggling?.enabled ? (
          <>
            끄면 autoflow 가 이 엔진 신호를 더 남기지 않고, 다음 배포 트리(TES6.0 · TLX6.0)에서 이 엔진 모듈이 빠집니다.
            <p style={{ margin: "8px 0 0", color: toggling.ready_count > 0 ? c.danger : c.textMuted }}>
              지금 READY 인 이 엔진 신호: {toggling.ready_count}건
              {toggling.ready_count > 0 && " — 끄면 ENGINE_UNKNOWN 으로 실패합니다."}
            </p>
          </>
        ) : (
          <>
            켜면 다음 배포 트리에 이 엔진을 넣고, 다음 릴리스부터 autoflow 신호를 남깁니다.
            <div role="status" style={{ marginTop: "10px", fontSize: theme.fontSize.sm, lineHeight: 1.7 }}>
              {check.loading && <span style={{ color: c.textMuted }}>GitLab 확인 중... (zip 을 받아 봅니다)</span>}
              {check.error && <span style={{ color: c.danger, whiteSpace: "pre-line" }}>{check.error}</span>}
              {check.result && (
                <>
                  <div>
                    배포할 버전 <b style={{ fontFamily: "monospace" }}>{check.result.tag ?? "-"}</b>
                    {check.result.first
                      ? " — 배포 기록이 없어 GitLab 에 가장 최근 올라온 패키지를 사람 확인 없이 FIRST 로 배포합니다. 켠 뒤 처음 도는 배포(정기 · 수동 · 다른 엔진 신호 어느 것이든)에 섞여 나갑니다."
                      : " — 이 엔진의 현재 배포 태그"}
                  </div>
                  {check.result.ok ? (
                    <div style={{ color: c.success }}>✓ GitLab 패키지 · zip · 모듈 파일 확인</div>
                  ) : (
                    <div style={{ color: c.danger }}>
                      켜면 postmark 배포 전체가 멈춥니다 — 먼저 고쳐 주세요.
                      {check.result.problems.map((p) => (
                        <div key={p}>· {p}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </ConfirmModal>
    </PageShell>
  );
}
