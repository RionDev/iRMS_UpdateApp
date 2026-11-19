import { PageShell } from "../components/PageShell";
import { EnginePanel } from "../panels/EnginePanel";
import { PatternPanel } from "../panels/PatternPanel";

/** 배포 현황 — 왼쪽 엔진, 오른쪽 패턴. 좁은 화면에서는 위아래로 쌓인다. */
export function StatusPage() {
  return (
    <PageShell title="배포 현황">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(560px, 1fr))",
          gap: "20px",
          flex: 1,
          minHeight: 0,
          alignItems: "stretch",
        }}
      >
        <EnginePanel />
        <PatternPanel />
      </div>
    </PageShell>
  );
}
