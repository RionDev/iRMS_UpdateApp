import { LogsPage } from "./pages/LogsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { StatusPage } from "./pages/StatusPage";
import { TargetsPage } from "./pages/TargetsPage";

export const updateRoutes = {
  status: <StatusPage />,
  logs: <LogsPage />,
  targets: <TargetsPage />,
  schedule: <SchedulePage />,
};
