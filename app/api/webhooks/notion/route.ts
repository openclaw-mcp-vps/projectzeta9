import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { ingestIntegrationSignals } from "@/lib/integrations/ingest";
import { extractNotionSignals } from "@/lib/integrations/notion";

export const runtime = "nodejs";

function verifyNotionSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return signature === digest;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("notion-signature") ?? "";

  if (!verifyNotionSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Notion signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signals = extractNotionSignals(payload);
  const fallbackProjectHint = String(
    ((payload.data as Record<string, unknown> | undefined)?.project as
      | string
      | undefined) ?? "",
  );

  const result = await ingestIntegrationSignals({
    provider: "notion",
    status: String(payload.type ?? "event"),
    message: `${signals.length} signal(s) generated from Notion payload`,
    signals,
    fallbackProjectHint,
  });

  return NextResponse.json({
    received: true,
    provider: "notion",
    signals: signals.length,
    alertsCreated: result.createdAlerts.length,
    matchedProjects: result.matchedProjectCount,
  });
}
