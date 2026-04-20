import crypto from "crypto";
import { addDays } from "date-fns";

import { env } from "@/lib/env";
import type { ProjectInput, ProjectStatus } from "@/lib/types";

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifyGitHubSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!env.GITHUB_WEBHOOK_SECRET) {
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", env.GITHUB_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex")}`;

  return safeCompare(expected, signatureHeader);
}

function statusFromGitHubPayload(payload: Record<string, unknown>): ProjectStatus {
  const openIssues = Number(
    (payload.repository as { open_issues_count?: number } | undefined)?.open_issues_count ?? 0
  );

  if (openIssues > 25) {
    return "off_track";
  }

  if (openIssues > 8) {
    return "at_risk";
  }

  return "on_track";
}

export function githubPayloadToProject(payload: Record<string, unknown>): ProjectInput {
  const repository =
    (payload.repository as { full_name?: string } | undefined)?.full_name ??
    "Unmapped GitHub Project";
  const owner =
    (payload.repository as { owner?: { login?: string } } | undefined)?.owner?.login ??
    (payload.sender as { login?: string } | undefined)?.login ??
    "unknown";

  const blockers = Number(
    (payload.repository as { open_issues_count?: number } | undefined)?.open_issues_count ?? 0
  );

  const action = String(payload.action ?? "sync");

  return {
    externalId: repository,
    source: "github",
    name: repository,
    owner,
    status: statusFromGitHubPayload(payload),
    healthScore: Math.max(20, 95 - Math.min(blockers * 2, 75)),
    milestones: [
      {
        title: `Stabilize backlog after ${action}`,
        dueDate: addDays(new Date(), blockers > 15 ? 5 : 12).toISOString(),
        completed: false,
        blockerCount: blockers
      }
    ]
  };
}
