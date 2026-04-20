import { NextResponse } from "next/server";

import { sendAlertDigest, generateProjectAlerts } from "@/lib/alert-engine";
import { enqueueDeadlineAnalysis } from "@/lib/deadline-jobs";
import { requestHasPaidAccess } from "@/lib/paywall";
import { publishRealtimeEvent } from "@/lib/redis";
import { getAlerts, getProjects, saveAlerts } from "@/lib/store";

export async function GET(request: Request): Promise<NextResponse> {
  if (!requestHasPaidAccess(request)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const alerts = await getAlerts(30);
  return NextResponse.json({ alerts });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!requestHasPaidAccess(request)) {
    return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const projects = await getProjects();
  const generated = generateProjectAlerts(projects);
  const created = await saveAlerts(generated);
  const queuedJobs = await enqueueDeadlineAnalysis(projects.map((project) => project.id));
  const digestSent = await sendAlertDigest(created);

  await publishRealtimeEvent("project-alerts", {
    type: "alerts.generated",
    count: created.length,
    at: new Date().toISOString()
  });

  return NextResponse.json({
    created: created.length,
    queuedJobs,
    digestSent
  });
}
