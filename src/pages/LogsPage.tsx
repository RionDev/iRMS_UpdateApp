import type { TableColumn } from "@common/components/BaseTable";
import { Drawer } from "@common/components/Drawer";
import { Input } from "@common/components/Input";
import { usePagedNav } from "@common/hooks/usePagedNav";
import { useThemeStore } from "@common/stores/themeStore";
import { useCallback, useState, type ReactNode } from "react";
import { Chips } from "../components/Chips";
import { PagedTable } from "../components/PagedTable";
import { PageShell } from "../components/PageShell";
import { Pane } from "../components/Pane";
import { StatusBadge } from "../components/StatusBadge";
import { LOG_RESULT, LOG_TRIGGER } from "../constants";
import { useLoadError } from "../hooks/useLoadError";
import { listLogs } from "../services/updateService";
import type { LogFilters, LogItem } from "../types/deploy";
import { parseInputs } from "../utils/inputs";
import { logCause } from "../utils/cause";
import { diffInputs, type InputChange } from "../utils/inputsDiff";

const PAGE_SIZE = 20;

const RESULT_OPTIONS = [
  { value: undefined, label: "전체" },
  ...[1, 2].map((r) => ({ value: r as number | undefined, label: LOG_RESULT[r].label })),
];

function Changes({ items, emptyText }: { items: InputChange[]; emptyText?: string }) {
  const { theme } = useThemeStore();
  if (items.length === 0) return <span style={{ color: theme.colors.textMuted }}>{emptyText ?? "-"}</span>;
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "4px 10px", fontFamily: "monospace", fontSize: theme.fontSize.sm }}>
      {items.map((c) => (
        <span key={c.label}>
          <b style={{ fontFamily: "inherit" }}>{c.label}</b> {c.from ?? "새로"} → <b style={{ color: theme.colors.primary }}>{c.to}</b>
        </span>
      ))}
    </span>
  );
}

function useLogs(kind: "engine" | "pattern", filters: LogFilters) {
  const key = JSON.stringify(filters);
  const { error, track } = useLoadError();
  const fetcher = useCallback(
    (cursor: string | undefined, snap: number | undefined, size: number) =>
      track(listLogs({ ...filters, kind }, cursor, snap, size)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, kind],
  );
  const nav = usePagedNav<LogItem>({ fetcher, size: PAGE_SIZE, deps: [key] });
  return { nav, error };
}

function LogDetail({ log }: { log: LogItem }) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const parsed = parseInputs(log.inputs);
  const d = diffInputs(log.inputs, log.prev_inputs, log.logged_at);
  const changedKeys = new Set([...d.engines, ...d.patterns].map((x) => x.label));
  const row = { display: "flex", gap: "12px", padding: "6px 0", borderBottom: `1px solid ${c.border}` };
  const k = { width: "140px", flexShrink: 0, color: c.textMuted };
  const line = (label: string, v: ReactNode) => (
    <div style={row}>
      <span style={k}>{label}</span>
      {v}
    </div>
  );
  return (
    <div style={{ padding: "24px", fontSize: theme.fontSize.base, color: c.text }}>
      <h2 style={{ margin: "0 0 16px", fontSize: theme.fontSize.xxl }}>배포 기록 #{log.id}</h2>
      {line("시각", log.logged_at)}
      {line("계기", <span style={{ display: "inline-flex", gap: "8px" }}><StatusBadge meta={LOG_TRIGGER[log.trigger]} />{logCause(log)}</span>)}
      {line("결과", <StatusBadge meta={LOG_RESULT[log.result]} />)}
      {log.reason && line("사유", <span style={{ color: c.danger }}>{log.reason}</span>)}
      <h3 style={{ margin: "24px 0 8px", fontSize: theme.fontSize.xl }}>이번에 바뀐 것</h3>
      {!d.compared ? (
        <p style={{ margin: 0, color: c.textMuted }}>앞 성공 배포가 없어 비교하지 않습니다.</p>
      ) : (
        <>
          {line("엔진", <Changes items={d.engines} />)}
          {line("패턴류", <Changes items={d.patterns} />)}
        </>
      )}
      {d.stale.length > 0 && log.trigger !== 2 && (
        <p style={{ margin: "8px 0 0", color: c.warning }}>
          ⚠ 배포한 날의 회차가 아닙니다: {d.stale.map((s) => `${s.label} ${s.value}`).join(" · ")} — 그날 빌드가 실패해 이전 회차가 나갔습니다.
        </p>
      )}
      <h3 style={{ margin: "24px 0 8px", fontSize: theme.fontSize.xl }}>들어간 전체 (바뀐 키 굵게)</h3>
      {parsed.ok && parsed.pairs.length > 0 ? (
        parsed.pairs.map(([key, value], i) => (
          <div key={`${key}-${i}`} style={{ ...row, padding: "3px 0" }}>
            <span style={{ ...k, fontFamily: "monospace" }}>{key}</span>
            <span style={{ fontFamily: "monospace", wordBreak: "break-all", fontWeight: changedKeys.has(key) ? 700 : 400 }}>{value}</span>
          </div>
        ))
      ) : (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: theme.fontSize.sm }}>{log.inputs}</pre>
      )}
    </div>
  );
}

export function LogsPage() {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [filters, setFilters] = useState<LogFilters>({});
  const [selected, setSelected] = useState<LogItem | null>(null);
  const engine = useLogs("engine", filters);
  const pattern = useLogs("pattern", filters);

  const result: TableColumn<LogItem> = {
    key: "result",
    label: "결과",
    render: (l) => (
      <span title={l.reason ?? undefined} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
        <StatusBadge meta={LOG_RESULT[l.result]} />
        {l.reason && <span style={{ color: c.danger, fontSize: theme.fontSize.sm }}>{l.reason.split(" ")[0]}</span>}
      </span>
    ),
  };
  const time: TableColumn<LogItem> = { key: "logged_at", label: "시각", render: (l) => l.logged_at.slice(5, 16) };

  const engineCols: TableColumn<LogItem>[] = [
    time,
    { key: "signal", label: "시그널", render: (l) => (l.signal_project_name ? `${l.signal_project_name} ${l.signal_tag}` : "-") },
    {
      key: "changed",
      label: "바뀐 엔진",
      render: (l) => {
        const d = diffInputs(l.inputs, l.prev_inputs, l.logged_at);
        return <Changes items={[...d.engines, ...d.patterns]} emptyText={l.result === 1 ? "바뀐 것 없음" : "-"} />;
      },
    },
    result,
  ];
  const patternCols: TableColumn<LogItem>[] = [
    time,
    {
      key: "cause",
      label: "계기",
      render: (l) => (
        <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
          <StatusBadge meta={LOG_TRIGGER[l.trigger]} />
          {l.trigger === 3 && <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>{logCause(l)}</span>}
        </span>
      ),
    },
    {
      key: "changed",
      label: "바뀐 것",
      render: (l) => {
        const d = diffInputs(l.inputs, l.prev_inputs, l.logged_at);
        return (
          <span style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
            <Changes items={[...d.patterns, ...d.engines]} emptyText={l.result === 1 ? "바뀐 것 없음" : "-"} />
            {l.result === 1 && d.stale.length > 0 && (
              <span style={{ color: c.warning, fontSize: theme.fontSize.sm }}>
                ⚠ 이전 회차: {d.stale.map((s) => `${s.label} ${s.value}`).join(" · ")}
              </span>
            )}
          </span>
        );
      },
    },
    result,
  ];

  return (
    <PageShell title="배포 기록">
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <Chips ariaLabel="결과" options={RESULT_OPTIONS} value={filters.result} onChange={(v) => setFilters({ ...filters, result: v })} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Input id="logs-from" type="date" aria-label="시작일" value={filters.date_from ?? ""} onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })} />
          ~
          <Input id="logs-to" type="date" aria-label="종료일" value={filters.date_to ?? ""} onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })} />
        </span>
        <span style={{ fontSize: theme.fontSize.sm, color: c.textMuted }}>
          기록 한 줄 = TES6.0 · TLX6.0 트리 전체를 한 번 내보낸 것. 바로 앞 성공 배포와 비교해 바뀐 것만 보여 줍니다. 행을 누르면 전체 입력.
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(560px, 1fr))", gap: "20px", flex: 1, minHeight: 0 }}>
        <Pane title="엔진" note="시그널 배포 — 그 엔진 태그만 바뀌고 패턴은 앞 배포 그대로">
          <PagedTable nav={engine.nav} columns={engineCols} rowKey={(l) => l.id} onRowClick={setSelected} empty="시그널 배포 기록이 없습니다." error={engine.error} />
        </Pane>
        <Pane title="패턴" note="정기 · 수동 배포 — archive 최신 회차(photon · BD · BFExcept)와 엔진 현재 태그">
          <PagedTable nav={pattern.nav} columns={patternCols} rowKey={(l) => l.id} onRowClick={setSelected} empty="정기 · 수동 배포 기록이 없습니다." error={pattern.error} />
        </Pane>
      </div>
      <Drawer isOpen={selected !== null} onClose={() => setSelected(null)} width="560px">
        {selected && <LogDetail log={selected} />}
      </Drawer>
    </PageShell>
  );
}
