// Isolated presentation fixture. Never imported by the application or deployed.
import { createRoot } from "react-dom/client";
import { Workspace } from "../../apps/web/src/components/workspace";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "../../apps/web/src/styles/legacy.css";
import "../../apps/web/src/styles/operations.css";
import "../../apps/web/src/styles/console.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing test fixture root");
const role = new URLSearchParams(window.location.search).get("role") || "ADMIN";
createRoot(root).render(<Workspace configured initialRole={role} />);

import "../../apps/web/src/styles/plan-feedback.css";
import "../../apps/web/src/styles/agenda-feedback.css";
import "../../apps/web/src/styles/schedule-feedback.css";
import "../../apps/web/src/styles/audit-feedback.css";
import "../../apps/web/src/styles/public-feedback.css";
import "../../apps/web/src/styles/comms-realtime.css";
