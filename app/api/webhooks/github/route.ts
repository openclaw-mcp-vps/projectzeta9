import { NextResponse } from "next/server";

import { computeHealthScore, statusFromHealth } from "@/lib/deadline-analyzer";
import { githubPayloadToProject, verifyGitHubSignature } from "@/lib/integrations/github";
import { publishRealtimeEvent } from "@/lib/redis";
import { saveProject } from "@/lib/store";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const projectInput = githubPayloadToProject(payload);

  const healthScore = computeHealthScore(
    projectInput.milestones.map((milestone, index) => ({
      id: `gh-${index}`,
      ...milestone
    }))
  );

  const project = await saveProject({
    ...projectInput,
    healthScore,
    status: statusFromHealth(healthScore)
  });

  await publishRealtimeEvent("project-updates", {
    type: "github.webhook.received",
    projectId: project.id,
    at: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, projectId: project.id });
}
