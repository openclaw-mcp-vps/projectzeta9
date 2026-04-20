import { format } from "date-fns";

import type { Milestone } from "@/lib/types";
import { cn } from "@/lib/utils";

function statusStyles(status: Milestone["status"]): string {
  switch (status) {
    case "complete":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
    case "blocked":
      return "border-rose-500/45 bg-rose-500/10 text-rose-200";
    case "at_risk":
      return "border-amber-400/45 bg-amber-500/10 text-amber-200";
    case "on_track":
      return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-300";
  }
}

export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const sorted = [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-3">
      {sorted.map((milestone) => (
        <div
          key={milestone.id}
          className={cn(
            "rounded-xl border px-4 py-3",
            statusStyles(milestone.status),
          )}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">{milestone.title}</p>
            <p className="text-xs uppercase tracking-wide">{milestone.status}</p>
          </div>
          <div className="mt-1 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>Owner: {milestone.owner}</p>
            <p>Due {format(new Date(milestone.dueDate), "MMM d, yyyy")}</p>
          </div>
          {milestone.notes ? (
            <p className="mt-2 text-xs text-slate-300">{milestone.notes}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
