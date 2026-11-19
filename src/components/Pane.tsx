import { useThemeStore } from "@common/stores/themeStore";
import type { ReactNode } from "react";

/** 배포 현황 화면의 반쪽 칸 — 제목 줄 + 세로로 채우는 본문. */
export function Pane({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  const { theme } = useThemeStore();
  return (
    <section
      aria-label={title}
      style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0, minHeight: 0 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexShrink: 0 }}>
        <h3 style={{ margin: 0, fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.text }}>{title}</h3>
        {note && <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>{note}</span>}
      </div>
      {children}
    </section>
  );
}
