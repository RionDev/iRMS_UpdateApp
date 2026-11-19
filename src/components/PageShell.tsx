import { AppLayout } from "@common/components/AppLayout";
import { useAppAccess } from "@common/hooks/useAuth";
import type { ReactNode } from "react";
import { UPDATE_APP } from "../features";
import { useUpdateNavItems } from "../navigation";

/** 업데이트 앱 공통 틀 — 앱 권한 확인 + 왼쪽 메뉴 + 세로로 채우는 본문. 엔진 | 패턴 두 칸이라 본문 폭 제한(1400px)을 풀어 화면 전체를 쓴다. */
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  useAppAccess(UPDATE_APP);
  const sidebarItems = useUpdateNavItems();
  return (
    <AppLayout title={title} appName="업데이트" sidebarItems={sidebarItems} version={__APP_VERSION__} contentMaxWidth="none">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}>{children}</div>
    </AppLayout>
  );
}
