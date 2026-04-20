import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, CalendarClock, Gauge, TriangleAlert } from "lucide-react";

import type { Project, ProjectHealthAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

function riskColor(level: ProjectHealthAnalysis["riskLevel"]): string {
  switch (level) {
    case "critical":
      return "text-rose-300 bg-rose-500/15 border-rose-400/50";
    case "high":
      return "text-amber-200 bg-amber-500/10 border-amber-300/45";
    case "medium":
      return "text-sky-200 bg-sky-500/10 border-sky-300/45";
    default:
      return "text-emerald-200 bg-emerald-500/10 border-emerald-300/45";
  }
}

export function ProjectHealthCard({
  project,
  analysis,
}: {
  project: Project;
  analysis: ProjectHealthAnalysis;
}) {
  const upcomingMilestone = [...project.milestones]
    .filter((milestone) => milestone.status !== "complete")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{project.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{project.description}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            riskColor(analysis.riskLevel),
          )}
        >
          <Gauge className="mr-1.5 h-3.5 w-3.5" />
          {analysis.riskLevel} risk
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Risk Score</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{analysis.riskScore}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Progress</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{project.progress}%</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Blocked</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{analysis.blockedMilestones}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Drift</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{analysis.driftDays}d</p>
        </div>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            analysis.riskLevel === "critical"
              ? "bg-rose-400"
              : analysis.riskLevel === "high"
                ? "bg-amber-400"
                : analysis.riskLevel === "medium"
                  ? "bg-sky-400"
                  : "bg-emerald-400",
          )}
          style={{ width: `${project.progress}%` }}
        />
      </div>

      {upcomingMilestone ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
          <CalendarClock className="h-4 w-4 text-cyan-300" />
          <span>
            Next milestone: <strong>{upcomingMilestone.title}</strong> due in{" "}
            {formatDistanceToNowStrict(new Date(upcomingMilestone.dueDate))}
          </span>
        </div>
      ) : null}

      {project.blockers.length > 0 ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-3">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200">
            <TriangleAlert className="h-3.5 w-3.5" />
            Active blockers
          </p>
          <ul className="space-y-1 text-sm text-amber-100/90">
            {project.blockers.slice(0, 2).map((blocker) => (
              <li key={blocker} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
