import { format } from "date-fns";
import { CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

type MilestoneTimelineProps = {
  project: Project;
};

export function MilestoneTimeline({ project }: MilestoneTimelineProps) {
  const milestones = [...project.milestones].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );

  return (
    <Card className="bg-[#0f172a]/70">
      <CardHeader>
        <CardTitle className="text-base">{project.name} Timeline</CardTitle>
        <CardDescription>Upcoming milestones and blocker pressure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="rounded-lg border border-[#1f2937] bg-[#0b1220] p-3 text-sm text-[#dbeafe]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-[#f8fafc]">{milestone.title}</p>
              <Badge variant={milestone.completed ? "success" : "default"}>
                {milestone.completed ? (
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="mr-1 h-3.5 w-3.5" />
                )}
                {milestone.completed ? "Done" : format(new Date(milestone.dueDate), "MMM d")}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-[#94a3b8]">
              {milestone.completed
                ? "Completed milestone, no active blockers."
                : `${milestone.blockerCount} blocker(s) tracked for this milestone.`}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
