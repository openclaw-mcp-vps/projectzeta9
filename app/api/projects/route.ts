import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { runDeadlineAnalysisJob } from "@/lib/alert-engine";
import { analyzePortfolio } from "@/lib/deadline-analyzer";
import { getProjects, upsertProject } from "@/lib/db/store";

export const runtime = "nodejs";

const milestoneSchema = z.object({
  title: z.string().min(3),
  dueDate: z.string().datetime(),
  status: z
    .enum(["planned", "on_track", "at_risk", "blocked", "complete"])
    .default("planned"),
  owner: z.string().min(2),
  notes: z.string().optional(),
});

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  description: z.string().min(10),
  startDate: z.string().datetime(),
  targetDate: z.string().datetime(),
  progress: z.number().int().min(0).max(100).optional(),
  blockers: z.array(z.string()).optional(),
  milestones: z.array(milestoneSchema).optional(),
  metadata: z
    .object({
      owner: z.string().min(2),
      team: z.string().min(2),
      repoUrl: z.string().url().optional(),
      linearProjectId: z.string().optional(),
      notionPageId: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  const projects = await getProjects();
  const portfolio = analyzePortfolio(projects);

  return NextResponse.json({
    projects,
    portfolio,
  });
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = projectSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid project payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const project = parsed.data;

    if (new Date(project.targetDate).getTime() <= new Date(project.startDate).getTime()) {
      return NextResponse.json(
        {
          error: "Target date must be later than start date.",
        },
        { status: 400 },
      );
    }

    const saved = await upsertProject({
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      targetDate: project.targetDate,
      progress: project.progress,
      blockers: project.blockers,
      milestones: (project.milestones ?? []).map((milestone) => ({
        id: randomUUID(),
        title: milestone.title,
        dueDate: milestone.dueDate,
        status: milestone.status,
        owner: milestone.owner,
        notes: milestone.notes,
        completedAt:
          milestone.status === "complete" ? new Date().toISOString() : undefined,
      })),
      metadata: project.metadata,
    });

    await runDeadlineAnalysisJob();

    return NextResponse.json({
      project: saved,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to create project",
      },
      { status: 500 },
    );
  }
}
