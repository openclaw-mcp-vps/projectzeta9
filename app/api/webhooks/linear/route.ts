import { NextResponse } from "next/server";

import { computeHealthScore, statusFromHealth } from "@/lib/deadline-analyzer";
import { linearPayloadToProject, verifyLinearSignature } from "@/lib/integrations/linear";
import { publishRealtimeEvent } from "@/lib/redis";
import { saveProject } from "@/lib/store";

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("linear-signature") ?? request.headers.get("x-linear-signature");

  if (!verifyLinearSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const projectInput = linearPayloadToProject(payload);

  const healthScore = computeHealthScore(
    projectInput.milestones.map((milestone, index) => ({
      id: `linear-${index}`,
      ...milestone
    }))
  );

  const project = await saveProject({
    ...projectInput,
    healthScore,
    status: statusFromHealth(healthScore)
  });

  await publishRealtimeEvent("project-updates", {
    type: "linear.webhook.received",
    projectId: project.id,
    at: new Date().toISOString()
  });

  return NextResponse.json({ ok: true, projectId: project.id });
}
