import { LinearClient } from "@linear/sdk";

import type { IntegrationSignal } from "@/lib/types";

export function createLinearClient(token = process.env.LINEAR_API_KEY): LinearClient | null {
  if (!token) {
    return null;
  }

  return new LinearClient({ apiKey: token });
}

export function extractLinearSignals(
  payload: Record<string, unknown>,
): IntegrationSignal[] {
  const type = String(payload.type ?? "unknown");
  const action = String(payload.action ?? "update");
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};
  const state =
    ((data.state as Record<string, unknown> | undefined)?.name as string | undefined) ??
    "";

  const projectHint =
    (data.project as Record<string, unknown> | undefined)?.name?.toString() ??
    (data.team as Record<string, unknown> | undefined)?.name?.toString() ??
    "";

  if (type === "Issue" && /blocked|stuck|on hold/i.test(state)) {
    return [
      {
        severity: "critical",
        title: "Linear issue blocked",
        message: `${String(data.title ?? "Issue")} moved to ${state} (${action}).`,
        projectHint,
        blocker: `${String(data.identifier ?? "Issue")} is currently blocked in Linear.`,
      },
    ];
  }

  if (type === "Project" && /off track|at risk/i.test(String(data.health ?? ""))) {
    return [
      {
        severity: "warning",
        title: "Linear project health warning",
        message: `${String(data.name ?? "Project")} is marked ${String(data.health)} in Linear.`,
        projectHint,
      },
    ];
  }

  return [
    {
      severity: "info",
      title: "Linear webhook received",
      message: `Captured ${type} ${action} event for timeline analysis.`,
      projectHint,
    },
  ];
}
