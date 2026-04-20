"use client";

import { useMemo } from "react";
import { BellRing, Check, Siren, TriangleAlert } from "lucide-react";

import type { Alert, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

function severityIcon(severity: Alert["severity"]) {
  if (severity === "critical") {
    return <Siren className="h-4 w-4 text-rose-200" />;
  }

  if (severity === "warning") {
    return <TriangleAlert className="h-4 w-4 text-amber-200" />;
  }

  return <BellRing className="h-4 w-4 text-sky-200" />;
}

function severityStyles(severity: Alert["severity"]): string {
  if (severity === "critical") {
    return "border-rose-500/40 bg-rose-500/10";
  }

  if (severity === "warning") {
    return "border-amber-400/40 bg-amber-500/10";
  }

  return "border-sky-400/30 bg-sky-500/10";
}

export function AlertsPanel({
  alerts,
  projects,
  onAcknowledge,
}: {
  alerts: Alert[];
  projects: Project[];
  onAcknowledge?: (alertId: string) => Promise<void>;
}) {
  const projectLookup = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
        No active alerts. Deadline risk is currently under control.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className={cn(
            "rounded-xl border p-4",
            severityStyles(alert.severity),
            alert.acknowledged ? "opacity-70" : "",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 rounded-md bg-slate-950/70 p-1.5">
                {severityIcon(alert.severity)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-300">{alert.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {projectLookup.get(alert.projectId) ?? "Unmatched project"} · {alert.source}
                </p>
              </div>
            </div>
            {onAcknowledge && !alert.acknowledged ? (
              <button
                type="button"
                onClick={() => void onAcknowledge(alert.id)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Acknowledge
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
