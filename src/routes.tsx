import { LogsPage } from "./pages/LogsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SignalsPage } from "./pages/SignalsPage";
import { TargetsPage } from "./pages/TargetsPage";

export const updateRoutes = {
  signals: <SignalsPage />,
  logs: <LogsPage />,
  requests: <RequestsPage />,
  targets: <TargetsPage />,
  schedule: <SchedulePage />,
};
