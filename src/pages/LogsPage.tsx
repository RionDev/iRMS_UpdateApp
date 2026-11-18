import type { TableColumn } from "@common/components/BaseTable";
import { Drawer } from "@common/components/Drawer";
import { Input } from "@common/components/Input";
import { usePagedNav } from "@common/hooks/usePagedNav";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useState } from "react";
import { Chips } from "../components/Chips";
import { PagedTable } from "../components/PagedTable";
import { PageShell } from "../components/PageShell";
import { StatusBadge } from "../components/StatusBadge";
import { LOG_RESULT, LOG_TRIGGER } from "../constants";
import { listLogs } from "../services/updateService";
import type { LogFilters, LogItem } from "../types/deploy";
import { parseInputs } from "../utils/inputs";

const PAGE_SIZE = 20;

const TRIGGER_OPTIONS = [
  { value: undefined, label: "전체" },
  ...[1, 2, 3].map((t) => ({ value: t as number | undefined, label: LOG_TRIGGER[t].label })),
];
const RESULT_OPTIONS = [
  { value: undefined, label: "전체" },
  ...[1, 2].map((r) => ({ value: r as number | undefined, label: LOG_RESULT[r].label })),
];

function linkText(l: LogItem) {
  if (l.signal_id) return l.signal_project_name ? `${l.signal_project_name} ${l.signal_tag}` : `시그널 #${l.signal_id}`;
  if (l.request_id) return `요청 #${l.request_id}`;
  return "-";
}

function LogDetail({ log }: { log: LogItem }) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const parsed = parseInputs(log.inputs);
  const row = { display: "flex", gap: "12px", padding: "6px 0", borderBottom: `1px solid ${c.border}` };
  const k = { width: "140px", flexShrink: 0, color: c.textMuted };
  return (
    <div style={{ padding: "24px", fontSize: theme.fontSize.base, color: c.text }}>
      <h2 style={{ margin: "0 0 16px", fontSize: theme.fontSize.xxl }}>배포 기록 #{log.id}</h2>
      <div style={row}>
        <span style={k}>시각</span>
        {log.logged_at}
      </div>
      <div style={row}>
        <span style={k}>계기</span>
        <StatusBadge meta={LOG_TRIGGER[log.trigger]} />
      </div>
      <div style={row}>
        <span style={k}>연결</span>
        {linkText(log)}
      </div>
      <div style={row}>
        <span style={k}>결과</span>
        <StatusBadge meta={LOG_RESULT[log.result]} />
      </div>
      {log.reason && (
        <div style={row}>
          <span style={k}>사유</span>
          <span style={{ color: c.danger }}>{log.reason}</span>
        </div>
      )}
      <h3 style={{ margin: "24px 0 8px", fontSize: theme.fontSize.xl }}>들어간 입력</h3>
      {parsed.ok && parsed.pairs.length > 0 ? (
        parsed.pairs.map(([key, value], i) => (
          <div key={`${key}-${i}`} style={row}>
            <span style={{ ...k, fontFamily: "monospace" }}>{key}</span>
            <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{value}</span>
          </div>
        ))
      ) : (
        <p style={{ margin: 0, color: c.textMuted }}>key=value 형식으로 풀 수 없어 원문만 보여 줍니다.</p>
      )}
      <pre
        style={{
          marginTop: "12px",
          padding: "10px 12px",
          background: c.surfaceMuted,
          borderRadius: theme.radius.sm,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontSize: theme.fontSize.sm,
        }}
      >
        {log.inputs}
      </pre>
    </div>
  );
}

export function LogsPage() {
  const { theme } = useThemeStore();
  const [filters, setFilters] = useState<LogFilters>({});
  const [selected, setSelected] = useState<LogItem | null>(null);
  const filterKey = JSON.stringify(filters);

  const fetcher = useCallback(
    (cursor: string | undefined, snap: number | undefined, size: number) => listLogs(filters, cursor, snap, size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  );
  const nav = usePagedNav<LogItem>({ fetcher, size: PAGE_SIZE, deps: [filterKey] });

  const columns: TableColumn<LogItem>[] = [
    { key: "logged_at", label: "시각" },
    { key: "trigger", label: "계기", render: (l) => <StatusBadge meta={LOG_TRIGGER[l.trigger]} /> },
    { key: "link", label: "연결", render: (l) => linkText(l) },
    { key: "result", label: "결과", render: (l) => <StatusBadge meta={LOG_RESULT[l.result]} /> },
    {
      key: "reason",
      label: "사유",
      render: (l) => (l.reason ? <span style={{ color: theme.colors.danger }}>{l.reason}</span> : "-"),
    },
  ];

  return (
    <PageShell title="배포 기록">
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <Chips
          ariaLabel="계기"
          options={TRIGGER_OPTIONS}
          value={filters.trigger}
          onChange={(v) => setFilters({ ...filters, trigger: v })}
        />
        <Chips
          ariaLabel="결과"
          options={RESULT_OPTIONS}
          value={filters.result}
          onChange={(v) => setFilters({ ...filters, result: v })}
        />
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Input
            id="logs-from"
            type="date"
            aria-label="시작일"
            value={filters.date_from ?? ""}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
          />
          ~
          <Input
            id="logs-to"
            type="date"
            aria-label="종료일"
            value={filters.date_to ?? ""}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
          />
        </span>
      </div>
      <PagedTable
        nav={nav}
        columns={columns}
        rowKey={(l) => l.id}
        onRowClick={setSelected}
        empty="배포 기록이 없습니다."
      />
      <Drawer isOpen={selected !== null} onClose={() => setSelected(null)} width="520px">
        {selected && <LogDetail log={selected} />}
      </Drawer>
    </PageShell>
  );
}
