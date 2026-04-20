import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { ingestIntegrationSignals } from "@/lib/integrations/ingest";
import { extractLinearSignals } from "@/lib/integrations/linear";

export const runtime = "nodejs";

function verifyLinearSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return signature === digest;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("linear-signature") ?? "";

  if (!verifyLinearSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Linear signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signals = extractLinearSignals(payload);
  const type = String(payload.type ?? "event");
  const action = String(payload.action ?? "update");

  const fallbackProjectHint =
    ((payload.data as Record<string, unknown> | undefined)?.project as
      | Record<string, unknown>
      | undefined)?.name?.toString() ?? "";

  const result = await ingestIntegrationSignals({
    provider: "linear",
    status: `${type}:${action}`,
    message: `${signals.length} signal(s) generated from Linear ${type} ${action}`,
    signals,
    fallbackProjectHint,
  });

  return NextResponse.json({
    received: true,
    provider: "linear",
    signals: signals.length,
    alertsCreated: result.createdAlerts.length,
    matchedProjects: result.matchedProjectCount,
  });
}
