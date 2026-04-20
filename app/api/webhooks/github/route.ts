import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import {
  extractGithubProjectHint,
  extractGithubSignals,
} from "@/lib/integrations/github";
import { ingestIntegrationSignals } from "@/lib/integrations/ingest";

export const runtime = "nodejs";

function verifyGithubSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return signature === `sha256=${digest}`;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!verifyGithubSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid GitHub signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signals = extractGithubSignals(event, payload);
  const fallbackProjectHint = extractGithubProjectHint(payload);

  const result = await ingestIntegrationSignals({
    provider: "github",
    status: event,
    message: `${signals.length} signal(s) generated from ${event}`,
    signals,
    fallbackProjectHint,
  });

  return NextResponse.json({
    received: true,
    provider: "github",
    signals: signals.length,
    alertsCreated: result.createdAlerts.length,
    matchedProjects: result.matchedProjectCount,
  });
}
