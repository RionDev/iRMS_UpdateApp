import type { SidebarItem } from "@common/components/AppLayout";
import { useFeatures } from "@common/hooks/useFeatures";
import { useMemo } from "react";
import { UPDATE_APP, UpdateFeature } from "./features";

const svg = (children: JSX.Element[]) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const signalIcon = svg([<polyline key="a" points="22 12 18 12 15 21 9 3 6 12 2 12" />]);
const logIcon = svg([
  <circle key="a" cx="12" cy="12" r="10" />,
  <polyline key="b" points="12 6 12 12 16 14" />,
]);
const targetIcon = svg([
  <rect key="a" x="3" y="3" width="7" height="7" />,
  <rect key="b" x="14" y="3" width="7" height="7" />,
  <rect key="c" x="14" y="14" width="7" height="7" />,
  <rect key="d" x="3" y="14" width="7" height="7" />,
]);
const scheduleIcon = svg([
  <rect key="a" x="3" y="4" width="18" height="18" rx="2" />,
  <line key="b" x1="16" y1="2" x2="16" y2="6" />,
  <line key="c" x1="8" y1="2" x2="8" y2="6" />,
  <line key="d" x1="3" y1="10" x2="21" y2="10" />,
]);

/** 왼쪽 메뉴. 네 화면 모두 조회(view) 권한으로 보이고, 편집 버튼만 각 화면에서 따로 숨긴다. */
export function useUpdateNavItems(): SidebarItem[] {
  const { can } = useFeatures(UPDATE_APP);
  return useMemo(() => {
    if (!can(UpdateFeature.VIEW)) return [];
    return [
      {
        label: "배포 상태",
        icon: signalIcon,
        children: [
          { label: "배포 현황", to: "/status", icon: signalIcon },
          { label: "배포 기록", to: "/logs", icon: logIcon },
        ],
      },
      {
        label: "배포 설정",
        icon: targetIcon,
        children: [
          { label: "배포 대상", to: "/targets", icon: targetIcon },
          { label: "배포 시각", to: "/schedule", icon: scheduleIcon },
        ],
      },
    ];
  }, [can]);
}
