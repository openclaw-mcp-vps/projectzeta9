import { addAlerts, addProjectBlocker, findProjectByHint, getProjects, recordIntegrationEvent } from "@/lib/db/store";
import { buildIntegrationAlerts } from "@/lib/alert-engine";
import type { Alert, IntegrationProvider, IntegrationSignal } from "@/lib/types";

export async function ingestIntegrationSignals(options: {
  provider: IntegrationProvider;
  status: string;
  message: string;
  signals: IntegrationSignal[];
  fallbackProjectHint?: string;
}): Promise<{ createdAlerts: Alert[]; matchedProjectCount: number }> {
  const allProjects = await getProjects();
  const defaultProject = allProjects[0];

  const alerts: Alert[] = [];
  let matchedProjectCount = 0;

  for (const signal of options.signals) {
    const project =
      (await findProjectByHint(signal.projectHint ?? options.fallbackProjectHint)) ??
      defaultProject;

    if (!project) {
      continue;
    }

    matchedProjectCount += 1;

    if (signal.blocker) {
      await addProjectBlocker(project.id, signal.blocker);
    }

    alerts.push(
      ...buildIntegrationAlerts(project.id, options.provider, [signal]),
    );
  }

  await addAlerts(alerts);

  await recordIntegrationEvent(options.provider, {
    status: options.status,
    message: options.message,
    health: "healthy",
    connected: true,
  });

  return {
    createdAlerts: alerts,
    matchedProjectCount,
  };
}
