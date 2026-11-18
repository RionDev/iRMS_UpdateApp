import type { TableColumn } from "@common/components/BaseTable";
import { SearchSelect } from "@common/components/SearchSelect";
import { usePagedNav } from "@common/hooks/usePagedNav";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useEffect, useState } from "react";
import { Chips } from "../components/Chips";
import { PagedTable } from "../components/PagedTable";
import { PageShell } from "../components/PageShell";
import { StatusBadge } from "../components/StatusBadge";
import { FIRST_BADGE, FIRST_TITLE, SIGNAL_STATUS } from "../constants";
import { listCurrent, listSignals } from "../services/updateService";
import type { CurrentItem, SignalFilters, SignalItem } from "../types/deploy";
import { gitlabPipelinesUrl, gitlabTagUrl } from "../utils/gitlab";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: undefined, label: "전체" },
  ...[1, 2, 3, 4].map((s) => ({ value: s as number | undefined, label: SIGNAL_STATUS[s].label })),
];
const KIND_OPTIONS: { value: SignalFilters["kind"]; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "signal", label: "시그널" },
  { value: "first", label: "FIRST" },
];

/** 'YYYY-MM-DD HH:MM:SS' → 'MM-DD HH:MM' (표에서 짧게) */
function short(t: string | null) {
  return t ? t.slice(5, 16) : "-";
}

function GitlabLinks({ name, tag }: { name: string; tag: string }) {
  const { theme } = useThemeStore();
  const a = { color: theme.colors.primary, textDecoration: "none" };
  return (
    <span style={{ display: "inline-flex", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
      <a href={gitlabTagUrl(name, tag)} target="_blank" rel="noreferrer" style={a}>
        태그
      </a>
      <a href={gitlabPipelinesUrl(name, tag)} target="_blank" rel="noreferrer" style={a}>
        파이프라인
      </a>
    </span>
  );
}

/** 위 요약: 엔진별 현재 배포 태그(postmark 기준과 같음) */
function CurrentStrip({ items }: { items: CurrentItem[] }) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <div
      aria-label="엔진별 현재 배포 태그"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "12px 16px",
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadow.card,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted, width: "100%" }}>엔진별 현재 배포 태그</span>
      {items.map((i) => (
        <span
          key={i.project_id}
          title={i.current_done_at ? `배포 완료 ${i.current_done_at}` : "아직 배포된 태그 없음"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 10px",
            border: `1px solid ${c.border}`,
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.base,
            opacity: i.enabled ? 1 : 0.5,
          }}
        >
          <b style={{ fontWeight: 600 }}>{i.project_name}</b>
          <span style={{ fontFamily: "monospace" }}>{i.current_tag ?? "-"}</span>
          {i.current_is_first && <StatusBadge meta={FIRST_BADGE} title={FIRST_TITLE} />}
          {i.latest_status !== null && i.latest_status !== 3 && (
            <StatusBadge meta={SIGNAL_STATUS[i.latest_status]} title={`가장 최근 시그널 ${i.latest_tag}`} />
          )}
          {!i.enabled && <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>꺼짐</span>}
        </span>
      ))}
    </div>
  );
}

export function SignalsPage() {
  const { theme } = useThemeStore();
  const [current, setCurrent] = useState<CurrentItem[]>([]);
  const [filters, setFilters] = useState<SignalFilters>({});
  const [reloadKey, setReloadKey] = useState(0);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    listCurrent()
      .then((p) => setCurrent(p.items))
      .catch(() => setCurrent([]));
  }, [reloadKey]);

  const fetcher = useCallback(
    (cursor: string | undefined, snap: number | undefined, size: number) => listSignals(filters, cursor, snap, size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, reloadKey],
  );
  const nav = usePagedNav<SignalItem>({ fetcher, size: PAGE_SIZE, deps: [filterKey, reloadKey] });

  const dim = (s: SignalItem) => (s.is_first ? { opacity: 0.6 } : undefined);
  const columns: TableColumn<SignalItem>[] = [
    { key: "project_name", label: "엔진", render: (s) => <span style={dim(s)}>{s.project_name}</span> },
    {
      key: "tag",
      label: "태그",
      render: (s) => <span style={{ fontFamily: "monospace", ...dim(s) }}>{s.tag}</span>,
    },
    {
      key: "status",
      label: "상태",
      render: (s) =>
        s.is_first ? (
          <StatusBadge meta={FIRST_BADGE} title={FIRST_TITLE} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <StatusBadge meta={SIGNAL_STATUS[s.status]} />
            {s.status === 4 && s.message && (
              <span style={{ color: theme.colors.danger, fontSize: theme.fontSize.sm }} title="실패 사유">
                {s.message}
              </span>
            )}
          </span>
        ),
    },
    { key: "created_at", label: "생성", render: (s) => <span style={dim(s)}>{short(s.created_at)}</span> },
    { key: "taken_at", label: "가져감", render: (s) => <span style={dim(s)}>{short(s.taken_at)}</span> },
    { key: "done_at", label: "완료", render: (s) => <span style={dim(s)}>{short(s.done_at)}</span> },
    { key: "gitlab", label: "GitLab", render: (s) => <GitlabLinks name={s.project_name} tag={s.tag} /> },
  ];

  return (
    <PageShell title="배포 시그널">
      <CurrentStrip items={current} />
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <SearchSelect
          aria-label="엔진"
          value={filters.project_name ?? ""}
          onChange={(e) => setFilters({ ...filters, project_name: e.target.value || undefined })}
          style={{ width: "160px" }}
        >
          <option value="">전체 엔진</option>
          {current.map((c) => (
            <option key={c.project_id} value={c.project_name}>
              {c.project_name}
            </option>
          ))}
        </SearchSelect>
        <Chips
          ariaLabel="상태"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
        />
        <Chips
          ariaLabel="구분"
          options={KIND_OPTIONS}
          value={filters.kind}
          onChange={(v) => setFilters({ ...filters, kind: v })}
        />
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          style={{
            marginLeft: "auto",
            height: "28px",
            padding: "0 12px",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            background: theme.colors.surface,
            color: theme.colors.text,
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </div>
      <PagedTable nav={nav} columns={columns} rowKey={(s) => s.id} empty="시그널이 없습니다." />
      <p style={{ margin: 0, fontSize: theme.fontSize.sm, color: theme.colors.textMuted, flexShrink: 0 }}>
        엔진 배포는 GitLab(master 머지 → CI · qc job) → autoflow → postmark 가 합니다. 이 화면은 상태만 보여 줍니다.
        다시 내보내려면 GitLab 에서 새로 릴리스하세요.
      </p>
    </PageShell>
  );
}
