import { Octokit } from "@octokit/rest";

import type { IntegrationSignal } from "@/lib/types";

export function createGithubClient(token = process.env.GITHUB_TOKEN): Octokit | null {
  if (!token) {
    return null;
  }

  return new Octokit({ auth: token });
}

export function extractGithubSignals(
  event: string,
  payload: Record<string, unknown>,
): IntegrationSignal[] {
  const signals: IntegrationSignal[] = [];

  if (event === "issues") {
    const issue = payload.issue as
      | { title?: string; html_url?: string; labels?: Array<{ name?: string }> }
      | undefined;
    const action = String(payload.action ?? "updated");
    const labels = issue?.labels?.map((label) => label.name?.toLowerCase() ?? "") ?? [];

    if (labels.includes("blocked")) {
      signals.push({
        severity: "critical",
        title: "Blocked GitHub issue detected",
        message: `${issue?.title ?? "Issue"} is marked blocked (${action}).`,
        projectHint: String((payload.repository as { name?: string })?.name ?? ""),
        blocker: `${issue?.title ?? "Issue"} is blocked. ${issue?.html_url ?? ""}`,
      });
    }
  }

  if (event === "pull_request") {
    const pr = payload.pull_request as
      | {
          title?: string;
          merged?: boolean;
          draft?: boolean;
          requested_reviewers?: unknown[];
          html_url?: string;
        }
      | undefined;

    if (pr?.draft) {
      signals.push({
        severity: "warning",
        title: "Draft PR still open near deadline",
        message: `${pr.title ?? "A pull request"} remains draft and could delay delivery.`,
        projectHint: String((payload.repository as { name?: string })?.name ?? ""),
      });
    }

    if (!pr?.merged && (pr?.requested_reviewers?.length ?? 0) >= 3) {
      signals.push({
        severity: "info",
        title: "Review bottleneck forming",
        message: `PR ${pr?.title ?? "update"} has many requested reviewers and may queue.`,
        projectHint: String((payload.repository as { name?: string })?.name ?? ""),
      });
    }
  }

  if (event === "workflow_run") {
    const run = payload.workflow_run as
      | {
          name?: string;
          conclusion?: string;
          html_url?: string;
        }
      | undefined;

    if (run?.conclusion === "failure") {
      signals.push({
        severity: "critical",
        title: "CI pipeline failure",
        message: `${run.name ?? "A workflow"} failed. ${run.html_url ?? ""}`,
        projectHint: String((payload.repository as { name?: string })?.name ?? ""),
        blocker: `${run.name ?? "Workflow"} failed and is blocking release.`,
      });
    }
  }

  if (signals.length === 0) {
    signals.push({
      severity: "info",
      title: "GitHub webhook received",
      message: `Captured ${event} event for project tracking telemetry.`,
      projectHint: String((payload.repository as { name?: string })?.name ?? ""),
    });
  }

  return signals;
}

export function extractGithubProjectHint(payload: Record<string, unknown>): string | undefined {
  const repository = payload.repository as
    | { name?: string; full_name?: string }
    | undefined;

  return repository?.name ?? repository?.full_name;
}
