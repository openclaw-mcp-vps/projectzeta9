import { NextResponse } from "next/server";
import { z } from "zod";

import { runDeadlineAnalysisJob } from "@/lib/alert-engine";
import { acknowledgeAlert, getAlerts, getProjects } from "@/lib/db/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("refresh") === "true") {
    await runDeadlineAnalysisJob();
  }

  const [alerts, projects] = await Promise.all([getAlerts(), getProjects()]);

  return NextResponse.json({
    alerts,
    projects,
  });
}

const acknowledgeSchema = z.object({
  alertId: z.string().min(1),
});

export async function PATCH(request: Request) {
  try {
    const parsed = acknowledgeSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updated = await acknowledgeAlert(parsed.data.alertId);

    if (!updated) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ alert: updated });
  } catch {
    return NextResponse.json(
      { error: "Unable to acknowledge alert" },
      { status: 500 },
    );
  }
}
