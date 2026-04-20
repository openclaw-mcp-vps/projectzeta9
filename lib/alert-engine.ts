import { createHash, randomUUID } from "node:crypto";

import { Resend } from "resend";
import { createClient, type RedisClientType } from "redis";

import { analyzeProjectHealth } from "@/lib/deadline-analyzer";
import { addAlerts, getAlerts, getProjects } from "@/lib/db/store";
import type { Alert, IntegrationSignal, Project } from "@/lib/types";

let redisClient: RedisClientType | null = null;

function getRedisClient(): RedisClientType | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", () => {
      // Keep the app resilient when Redis is unavailable.
    });
  }

  return redisClient;
}

async function publishAlert(alert: Alert): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    if (!client.isOpen) {
      await client.connect();
    }

    await client.publish("projectzeta9:alerts", JSON.stringify(alert));
  } catch {
    // Redis is optional for local/dev usage.
  }
}

async function notifyByEmail(alerts: Alert[], projects: Project[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERTS_EMAIL_TO;
  const from = process.env.ALERTS_EMAIL_FROM;

  if (!apiKey || !to || !from || alerts.length === 0) {
    return;
  }

  const projectMap = new Map(projects.map((project) => [project.id, project.name]));

  const body = alerts
    .slice(0, 8)
    .map((alert) => {
      const projectName = projectMap.get(alert.projectId) ?? "Unknown project";
      return `- [${alert.severity.toUpperCase()}] ${projectName}: ${alert.title} — ${alert.message}`;
    })
    .join("\n");

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to,
      subject: `ProjectZeta9: ${alerts.length} timeline alerts detected`,
      text: `New alert digest from ProjectZeta9:\n\n${body}`,
    });
  } catch {
    // Email is best effort only.
  }
}

function buildDeadlineAlertId(
  projectId: string,
  title: string,
  message: string,
  source: Alert["source"],
): string {
  const digest = createHash("sha256")
    .update(`${projectId}:${source}:${title}:${message}`)
    .digest("hex")
    .slice(0, 24);

  return `alt_${digest}`;
}

export function generateDeadlineAlerts(
  projects: Project[],
  existingAlerts: Alert[],
): Alert[] {
  const existingIds = new Set(existingAlerts.map((alert) => alert.id));
  const nextAlerts: Alert[] = [];

  for (const project of projects) {
    const analysis = analyzeProjectHealth(project);

    if (analysis.riskLevel === "high" || analysis.riskLevel === "critical") {
      const title =
        analysis.riskLevel === "critical"
          ? "Critical deadline drift detected"
          : "Project trending behind schedule";
      const message = analysis.summary;
      const id = buildDeadlineAlertId(
        project.id,
        title,
        message,
        "deadline-analyzer",
      );

      if (!existingIds.has(id)) {
        nextAlerts.push({
          id,
          projectId: project.id,
          severity: analysis.riskLevel === "critical" ? "critical" : "warning",
          title,
          message,
          source: "deadline-analyzer",
          acknowledged: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    for (const milestone of project.milestones) {
      const isOverdue =
        milestone.status !== "complete" &&
        new Date(milestone.dueDate).getTime() < Date.now();

      if (!isOverdue) {
        continue;
      }

      const title = `Overdue milestone: ${milestone.title}`;
      const message = `Milestone owned by ${milestone.owner} is past due and should be re-planned.`;
      const id = buildDeadlineAlertId(
        project.id,
        title,
        message,
        "deadline-analyzer",
      );

      if (!existingIds.has(id)) {
        nextAlerts.push({
          id,
          projectId: project.id,
          severity: "critical",
          title,
          message,
          source: "deadline-analyzer",
          acknowledged: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return nextAlerts;
}

export function buildIntegrationAlerts(
  projectId: string,
  source: Alert["source"],
  signals: IntegrationSignal[],
): Alert[] {
  return signals.map((signal) => ({
    id: `alt_${createHash("sha1")
      .update(`${projectId}:${source}:${signal.title}:${signal.message}`)
      .digest("hex")
      .slice(0, 24)}`,
    projectId,
    severity: signal.severity,
    title: signal.title,
    message: signal.message,
    source,
    acknowledged: false,
    createdAt: new Date().toISOString(),
  }));
}

export async function runDeadlineAnalysisJob(): Promise<{
  created: number;
  alerts: Alert[];
}> {
  const projects = await getProjects();
  const existingAlerts = await getAlerts();
  const newAlerts = generateDeadlineAlerts(projects, existingAlerts);

  if (newAlerts.length > 0) {
    await addAlerts(newAlerts);
    await Promise.all(newAlerts.map((alert) => publishAlert(alert)));
    await notifyByEmail(newAlerts, projects);
  }

  return {
    created: newAlerts.length,
    alerts: newAlerts,
  };
}

export function createSystemAlert(projectId: string, message: string): Alert {
  return {
    id: randomUUID(),
    projectId,
    severity: "info",
    title: "System notification",
    message,
    source: "system",
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };
}
