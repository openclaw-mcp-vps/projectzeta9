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

export function verifyLinearSignature(rawBody: string, signature: string | null): boolean {
  if (!env.LINEAR_WEBHOOK_SECRET) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.LINEAR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return safeCompare(expected, signature);
}

function statusFromLinearState(stateType: string | undefined): ProjectStatus {
  if (stateType === "completed") {
    return "on_track";
  }

  if (stateType === "started") {
    return "at_risk";
  }

  return "off_track";
}

export function linearPayloadToProject(payload: Record<string, unknown>): ProjectInput {
  const data = payload.data as
    | {
        identifier?: string;
        title?: string;
        dueDate?: string;
        project?: { name?: string };
        team?: { name?: string };
        state?: { type?: string };
      }
    | undefined;

  const title = data?.project?.name ?? data?.title ?? "Linear Initiative";
  const dueDate = data?.dueDate ? new Date(data.dueDate).toISOString() : addDays(new Date(), 14).toISOString();
  const status = statusFromLinearState(data?.state?.type);
  const blockerCount = status === "off_track" ? 4 : status === "at_risk" ? 2 : 0;

  return {
    externalId: data?.identifier ?? title,
    source: "linear",
    name: title,
    owner: data?.team?.name ?? "Linear Team",
    status,
    healthScore: status === "on_track" ? 88 : status === "at_risk" ? 63 : 37,
    milestones: [
      {
        title: data?.title ?? "Resolve pending Linear issues",
        dueDate,
        completed: status === "on_track",
        blockerCount
      }
    ]
  };
}
