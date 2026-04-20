import { differenceInCalendarDays, parseISO } from "date-fns";
import { Resend } from "resend";

import { analyzeProjectHealth } from "@/lib/deadline-analyzer";
import { env } from "@/lib/env";
import type { AlertSeverity, Project, ProjectAlert } from "@/lib/types";

function severityFromHealth(healthScore: number): AlertSeverity {
  if (healthScore < 45) {
    return "critical";
  }

  if (healthScore < 70) {
    return "warning";
  }

  return "info";
}

export function generateProjectAlerts(projects: Project[]): Omit<ProjectAlert, "id" | "createdAt">[] {
  const alerts: Omit<ProjectAlert, "id" | "createdAt">[] = [];

  for (const project of projects) {
    const analysis = analyzeProjectHealth(project);

    if (analysis.healthScore < 75) {
      alerts.push({
        projectId: project.id,
        severity: severityFromHealth(analysis.healthScore),
        message: `${project.name} health dropped to ${analysis.healthScore}. ${analysis.highRiskMilestones} milestone(s) now high risk.`
      });
    }

    for (const milestone of project.milestones) {
      if (milestone.completed) {
        continue;
      }

      const daysRemaining = differenceInCalendarDays(parseISO(milestone.dueDate), new Date());

      if (daysRemaining <= 2) {
        alerts.push({
          projectId: project.id,
          severity: daysRemaining <= 0 ? "critical" : "warning",
          message: `${project.name} milestone "${milestone.title}" is ${
            daysRemaining <= 0 ? "overdue" : `due in ${daysRemaining} day(s)`
          } with ${milestone.blockerCount} blocker(s).`
        });
      }
    }
  }

  return alerts;
}

export async function sendAlertDigest(alerts: ProjectAlert[]): Promise<boolean> {
  if (!env.RESEND_API_KEY || alerts.length === 0) {
    return false;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const critical = alerts.filter((alert) => alert.severity === "critical");

  const html = [
    "<h1>ProjectZeta9 Alert Digest</h1>",
    `<p>Generated ${new Date().toISOString()} with ${alerts.length} alert(s).</p>`,
    "<ul>",
    ...alerts.map(
      (alert) =>
        `<li><strong>${alert.severity.toUpperCase()}:</strong> ${alert.message} (${alert.createdAt})</li>`
    ),
    "</ul>"
  ].join("");

  try {
    await resend.emails.send({
      from: env.ALERT_FROM_EMAIL,
      to: [env.ALERT_FROM_EMAIL],
      subject: `ProjectZeta9 Alert Digest (${critical.length} critical)`,
      html
    });

    return true;
  } catch (error) {
    console.error("Failed to send alert digest", error);
    return false;
  }
}
