import { Button } from "@common/components/Button";
import { useFeatures } from "@common/hooks/useFeatures";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { PageShell } from "../components/PageShell";
import { UPDATE_APP, UpdateFeature } from "../features";
import { useLoadError } from "../hooks/useLoadError";
import { listDaemonPolicies, updateDaemonPolicies } from "../services/updateService";
import type { DaemonPolicies, DaemonPolicy, PolicyEdits, PolicyKey } from "../types/deploy";
import { InputError } from "../utils/error";
import { changedOnly, editErrors, editList } from "../utils/policy";

function rangeText(k: PolicyKey) {
  return k.kind === "uint" && k.min !== null ? `${k.min}~${k.max}` : null;
}

function DaemonCard({
  d,
  edits,
  errors,
  canEdit,
  onEdit,
}: {
  d: DaemonPolicy;
  edits: PolicyEdits;
  errors: Record<string, string>;
  canEdit: boolean;
  onEdit: (service: string, key: string, value: string) => void;
}) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const broken = d.parse_errors.length > 0;
  return (
    <section
      aria-label={d.service}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadow.card,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
        <b style={{ fontSize: theme.fontSize.lg, fontWeight: 700 }}>{d.service}</b>
        <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>{d.host}</span>
        {d.updated_date && (
          <span style={{ marginLeft: "auto", fontSize: theme.fontSize.sm, color: c.textMuted }}>수정 {d.updated_date.slice(0, 16)}</span>
        )}
      </div>
      {d.desc && <div style={{ fontSize: theme.fontSize.sm, color: c.textMuted, lineHeight: 1.6 }}>주의: {d.desc}</div>}
      {broken && (
        <div role="alert" style={{ fontSize: theme.fontSize.sm, color: c.danger, lineHeight: 1.6 }}>
          지금 DB 값을 데몬 규칙으로 풀지 못해 웹에서 고칠 수 없습니다.
          {d.parse_errors.map((e) => (
            <div key={e}>· {e}</div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) minmax(180px, 1.3fr)", columnGap: "12px", rowGap: "10px" }}>
        {d.keys.map((k) => {
          const id = `${d.service}.${k.name}`;
          const edited = edits[d.service]?.[k.name];
          const value = edited ?? d.values[k.name] ?? "";
          const err = errors[id];
          const changed = edited !== undefined && edited !== d.values[k.name];
          const editable = canEdit && !broken && !k.readonly;
          const range = rangeText(k);
          return (
            <div key={k.name} style={{ display: "contents" }}>
              <label htmlFor={id} style={{ fontSize: theme.fontSize.base, lineHeight: 1.4 }}>
                {k.label}
                <div style={{ fontFamily: "monospace", fontSize: theme.fontSize.sm, color: c.textMuted }}>{k.name}</div>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                {editable ? (
                  <input
                    id={id}
                    value={value}
                    onChange={(e) => onEdit(d.service, k.name, e.target.value)}
                    aria-invalid={!!err}
                    style={{
                      height: "30px",
                      padding: "0 8px",
                      fontFamily: "monospace",
                      fontSize: theme.fontSize.base,
                      color: c.text,
                      background: changed ? c.surfaceMuted : c.surface,
                      border: `1px solid ${err ? c.danger : changed ? c.primary : c.border}`,
                      borderRadius: theme.radius.sm,
                      minWidth: 0,
                    }}
                  />
                ) : (
                  <span
                    id={id}
                    title={k.readonly ?? undefined}
                    style={{ fontFamily: "monospace", fontSize: theme.fontSize.base, padding: "5px 0", wordBreak: "break-all" }}
                  >
                    {value || "-"}
                    {k.readonly && <span style={{ fontFamily: "inherit", color: c.textMuted }}> 🔒</span>}
                  </span>
                )}
                {err && (
                  <span role="alert" style={{ fontSize: theme.fontSize.sm, color: c.danger }}>
                    {err}
                  </span>
                )}
                <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted, lineHeight: 1.5 }}>
                  {range && <b style={{ fontWeight: 600 }}>{range} · </b>}
                  {k.readonly ? `읽기 전용 — ${k.readonly}` : k.help}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PoliciesPage() {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const { can } = useFeatures(UPDATE_APP);
  const canEdit = can(UpdateFeature.SETTINGS);
  const [data, setData] = useState<DaemonPolicies | null>(null);
  const [edits, setEdits] = useState<PolicyEdits>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { error: loadError, track } = useLoadError();

  const load = useCallback(() => {
    track(listDaemonPolicies())
      .then((d) => {
        setData(d);
        setEdits({});
      })
      .catch(() => {});
  }, [track]);
  useEffect(load, [load]);

  const errors = useMemo(() => (data ? editErrors(data, edits) : {}), [data, edits]);
  const changes = useMemo(() => (data ? editList(data, edits) : []), [data, edits]);
  const hasErrors = Object.keys(errors).length > 0;

  const onEdit = (service: string, key: string, value: string) =>
    setEdits((e) => ({ ...e, [service]: { ...e[service], [key]: value } }));

  return (
    <PageShell title="데몬 정책">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 1,
          padding: "10px 0",
          background: c.pageBackground,
          flexShrink: 0,
        }}
      >
        <span style={{ flex: 1, minWidth: "320px", fontSize: theme.fontSize.base, color: c.text, lineHeight: 1.6 }}>
          photon-db <span style={{ fontFamily: "monospace" }}>policy_daemon</span> — 데몬 6개가 약 1시간마다 다시 읽습니다.
          <br />
          <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>
            데몬은 값을 거의 검사하지 않고 틀린 값은 다음 재시작 때 기동 실패로 드러나므로, 데몬을 멈추거나 데이터를 지울 수
            있는 값은 저장하지 않습니다. 🔒 는 다른 데몬의 코드 상수와 짝이라 바꿀 수 없는 값입니다.
          </span>
        </span>
        {canEdit && data && (
          <>
            <span style={{ fontSize: theme.fontSize.sm, color: hasErrors ? c.danger : c.textMuted }}>
              {hasErrors ? `고칠 칸 ${Object.keys(errors).length}개` : `바뀐 값 ${changes.length}개`}
            </span>
            <Button type="button" variant="secondary" onClick={() => setEdits({})} disabled={changes.length === 0 && !hasErrors}>
              되돌리기
            </Button>
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={changes.length === 0 || hasErrors}>
              저장
            </Button>
          </>
        )}
      </div>
      {loadError && (
        <div role="alert" style={{ color: c.danger, fontSize: theme.fontSize.base }}>
          {loadError}
        </div>
      )}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))", gap: "16px", alignItems: "start" }}>
          {data.services.map((d) => (
            <DaemonCard key={d.service} d={d} edits={edits} errors={errors} canEdit={canEdit} onEdit={onEdit} />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="데몬 정책 저장"
        confirmLabel="저장"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!data) return;
          if (hasErrors) throw new InputError("빨간 칸을 먼저 고쳐 주세요");
          const fresh = await updateDaemonPolicies(changedOnly(data, edits));
          setData(fresh);
          setEdits({});
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {changes.map((ch) => (
            <div key={`${ch.service}.${ch.key}`} style={{ fontFamily: "monospace", fontSize: theme.fontSize.sm, wordBreak: "break-all" }}>
              {ch.service}.{ch.key}: {ch.from} → <b>{ch.to}</b>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", color: c.warning, fontSize: theme.fontSize.sm }}>
            데몬이 약 1시간 안에 다시 읽어 반영합니다. 보관 일수는 날짜가 바뀔 때, 빌드 · 업데이트 시각은 지금 시각과 같으면 바로
            돕니다.
          </p>
        </div>
      </ConfirmModal>
    </PageShell>
  );
}
