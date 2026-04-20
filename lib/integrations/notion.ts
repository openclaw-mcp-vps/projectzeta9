import { Client as NotionClient } from "@notionhq/client";

import type { IntegrationSignal } from "@/lib/types";

export function createNotionClient(
  token = process.env.NOTION_API_KEY,
): NotionClient | null {
  if (!token) {
    return null;
  }

  return new NotionClient({ auth: token });
}

export function extractNotionSignals(
  payload: Record<string, unknown>,
): IntegrationSignal[] {
  const eventType = String(payload.type ?? "event");
  const data = (payload.data as Record<string, unknown> | undefined) ?? {};

  const title =
    ((data.title as string | undefined) ??
      (data.pageTitle as string | undefined) ??
      "Notion record")
      .trim();

  const status = String(data.status ?? "");
  const projectHint = String(data.project ?? data.database ?? "");

  if (/blocked|stalled|overdue/i.test(status)) {
    return [
      {
        severity: "warning",
        title: "Notion milestone flagged",
        message: `${title} is marked as ${status} in Notion.`,
        projectHint,
      },
    ];
  }

  return [
    {
      severity: "info",
      title: "Notion webhook received",
      message: `Captured ${eventType} change for project knowledge tracking.`,
      projectHint,
    },
  ];
}
