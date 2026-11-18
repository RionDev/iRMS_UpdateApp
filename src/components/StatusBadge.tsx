import { useThemeStore } from "@common/stores/themeStore";
import type { StatusMeta, Tone } from "../constants";

/** 상태 알약. 색은 common theme 토큰(success · danger · warning · primary · textMuted)에서. */
export function StatusBadge({ meta, title }: { meta: StatusMeta | undefined; title?: string }) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const color: Record<Tone, string> = {
    info: c.primary,
    warning: c.warning,
    success: c.success,
    danger: c.danger,
    muted: c.textMuted,
  };
  const fg = meta ? color[meta.tone] : c.textMuted;
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        padding: "0 8px",
        lineHeight: "20px",
        borderRadius: "999px",
        fontSize: theme.fontSize.sm,
        fontWeight: 600,
        color: fg,
        border: `1px solid ${fg}`,
        whiteSpace: "nowrap",
      }}
    >
      {meta?.label ?? "?"}
    </span>
  );
}
