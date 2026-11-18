import { useThemeStore } from "@common/stores/themeStore";

export interface ChipOption<V> {
  value: V;
  label: string;
}

/** 한 개만 고르는 칩 묶음 (목업의 상태 칩). */
export function Chips<V extends string | number | undefined>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ChipOption<V>[];
  value: V;
  onChange: (v: V) => void;
  ariaLabel: string;
}) {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={{
              height: "28px",
              padding: "0 12px",
              borderRadius: "999px",
              border: `1px solid ${on ? c.primary : c.border}`,
              background: on ? c.primary : c.surface,
              color: on ? c.primaryText : c.text,
              fontSize: theme.fontSize.base,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
