"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

type ProjectHealthCardProps = {
  project: Project;
};

const statusMeta: Record<
  Project["status"],
  { badge: "success" | "warning" | "danger"; icon: typeof CheckCircle2; label: string }
> = {
  on_track: { badge: "success", icon: CheckCircle2, label: "On Track" },
  at_risk: { badge: "warning", icon: Clock3, label: "At Risk" },
  off_track: { badge: "danger", icon: AlertTriangle, label: "Off Track" }
};

export function ProjectHealthCard({ project }: ProjectHealthCardProps) {
  const status = statusMeta[project.status];
  const StatusIcon = status.icon;

  return (
    <Card className="h-full bg-[#0f172a]/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base md:text-lg">{project.name}</CardTitle>
          <CardDescription>
            Owned by {project.owner} • Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </CardDescription>
        </div>
        <Badge variant={status.badge} className="gap-1">
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-[120px_1fr] gap-4">
        <div className="h-[110px] w-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={[{ name: "health", value: project.healthScore }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: "#1f2937" }}
                dataKey="value"
                cornerRadius={10}
                fill="#38bdf8"
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[#e2e8f0] text-lg font-semibold"
              >
                {project.healthScore}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-sm text-[#cbd5e1]">
          <p>
            <span className="font-semibold text-[#f8fafc]">{project.milestones.length}</span> active milestone(s)
          </p>
          <p>
            <span className="font-semibold text-[#f8fafc]">
              {project.milestones.filter((milestone) => !milestone.completed).length}
            </span>{" "}
            still open
          </p>
          <p>
            <span className="font-semibold text-[#f8fafc]">
              {project.milestones.reduce((sum, milestone) => sum + milestone.blockerCount, 0)}
            </span>{" "}
            current blockers
          </p>
          <p className="text-xs uppercase tracking-wide text-[#64748b]">Source: {project.source}</p>
        </div>
      </CardContent>
    </Card>
  );
}
