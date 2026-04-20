import { NextResponse } from "next/server";
import { z } from "zod";

import { computeHealthScore, statusFromHealth } from "@/lib/deadline-analyzer";
import { requestHasPaidAccess } from "@/lib/paywall";
import { publishRealtimeEvent } from "@/lib/redis";
import { getProjects, saveProject } from "@/lib/store";

const createProjectSchema = z.object({
  source: z.enum(["manual", "github", "linear"]).default("manual"),
  name: z.string().min(2).max(120),
  owner: z.string().min(2).max(120),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2).max(180),
        dueDate: z.string().min(4),
        completed: z.boolean().optional().default(false),
        blockerCount: z.number().int().min(0).max(100).optional().default(0)
      })
    )
    .min(1)
    .max(30)
});

export async function GET(request: Request): Promise<NextResponse> {
  if (!requestHasPaidAccess(request)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const projects = await getProjects();

  return NextResponse.json({
    projects,
    summary: {
      totalProjects: projects.length,
      avgHealth:
        projects.length > 0
          ? Math.round(projects.reduce((sum, project) => sum + project.healthScore, 0) / projects.length)
          : 0,
      atRisk: projects.filter((project) => project.status !== "on_track").length
    }
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!requestHasPaidAccess(request)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const json = (await request.json()) as unknown;
  const parsed = createProjectSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const normalizedMilestones = parsed.data.milestones.map((milestone) => ({
    title: milestone.title,
    dueDate: new Date(milestone.dueDate).toISOString(),
    completed: milestone.completed,
    blockerCount: milestone.blockerCount
  }));

  const healthScore = computeHealthScore(
    normalizedMilestones.map((milestone, index) => ({
      id: `preview-${index}`,
      ...milestone
    }))
  );

  const project = await saveProject({
    source: parsed.data.source,
    name: parsed.data.name,
    owner: parsed.data.owner,
    status: statusFromHealth(healthScore),
    healthScore,
    milestones: normalizedMilestones
  });

  await publishRealtimeEvent("project-updates", {
    type: "project.created",
    projectId: project.id,
    at: new Date().toISOString()
  });

  return NextResponse.json({ project }, { status: 201 });
}
