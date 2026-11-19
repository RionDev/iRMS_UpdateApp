import { BaseTable, type TableColumn } from "@common/components/BaseTable";
import { Pagination } from "@common/components/Pagination";
import { TableBlock } from "@common/components/TableBlock";
import { TableEmptyState } from "@common/components/TableEmptyState";
import type { UsePagedNavResult } from "@common/hooks/usePagedNav";
import { useThemeStore } from "@common/stores/themeStore";

/** TableBlock + BaseTable + 빈 상태 + Pagination 묶음 (admin 페이지 조립 방식 그대로). */
export function PagedTable<T>({
  nav,
  columns,
  rowKey,
  onRowClick,
  empty,
  error,
}: {
  nav: Pick<UsePagedNavResult<T>, "items" | "loading" | "page" | "totalPages" | "total" | "totalCapped" | "hasPrev" | "hasNext" | "prev" | "next">;
  columns: TableColumn<T>[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  empty: string;
  /** 조회 실패 문구 — 있으면 '없습니다' 대신 보인다 */
  error?: string | null;
}) {
  const { theme } = useThemeStore();
  return (
    <TableBlock>
      <div style={{ overflowX: "auto" }}>
        <BaseTable items={nav.items} columns={columns} rowKey={rowKey} onRowClick={onRowClick} />
      </div>
      {nav.loading && nav.items.length === 0 && <TableEmptyState>불러오는 중...</TableEmptyState>}
      {!nav.loading && error && (
        <TableEmptyState>
          <span role="alert" style={{ color: theme.colors.danger }}>
            {error}
          </span>
        </TableEmptyState>
      )}
      {!nav.loading && !error && nav.items.length === 0 && <TableEmptyState>{empty}</TableEmptyState>}
      <div style={{ marginTop: "auto" }}>
        <Pagination
          page={nav.page}
          totalPages={nav.totalPages}
          total={nav.total}
          totalCapped={nav.totalCapped}
          hasPrev={nav.hasPrev}
          hasNext={nav.hasNext}
          onPrev={nav.prev}
          onNext={nav.next}
          loading={nav.loading}
        />
      </div>
    </TableBlock>
  );
}

/** 한 페이지로 오는 작은 목록용 nav (배포 대상 · 배포 시각). */
export function staticNav<T>(items: T[], loading: boolean) {
  return {
    items,
    loading,
    page: 1,
    totalPages: 1,
    total: items.length,
    totalCapped: false,
    hasPrev: false,
    hasNext: false,
    prev: async () => {},
    next: async () => {},
  };
}
