import { LogsPage } from "./pages/LogsPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { StatusPage } from "./pages/StatusPage";
import { TargetsPage } from "./pages/TargetsPage";

export const updateRoutes = {
  status: <StatusPage />,
  logs: <LogsPage />,
  targets: <TargetsPage />,
  policies: <PoliciesPage />,
};
