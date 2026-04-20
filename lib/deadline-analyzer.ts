import {
  differenceInCalendarDays,
  parseISO,
  isBefore,
  addDays,
  differenceInDays,
} from "date-fns";

import { clamp } from "@/lib/utils";
import type { Project, ProjectHealthAnalysis, RiskLevel } from "@/lib/types";

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Moderate risk",
  high: "High risk",
  critical: "Critical risk",
};

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 60) {
    return "high";
  }

  if (score >= 35) {
    return "medium";
  }

  return "low";
}

function estimateDriftDays(project: Project): number {
  const now = new Date();
  const start = parseISO(project.startDate);
  const target = parseISO(project.targetDate);
  const elapsedDays = Math.max(1, differenceInDays(now, start));

  const complete = project.milestones.filter(
    (milestone) => milestone.status === "complete",
  ).length;

  const remaining = project.milestones.length - complete;

  if (remaining <= 0) {
    return 0;
  }

  const throughputPerDay = Math.max(0.05, complete / elapsedDays);
  const daysNeeded = remaining / throughputPerDay;
  const daysLeft = Math.max(1, differenceInDays(target, now));

  return Math.round(daysNeeded - daysLeft);
}

export function analyzeProjectHealth(project: Project): ProjectHealthAnalysis {
  const now = new Date();
  const soon = addDays(now, 7);

  let overdueMilestones = 0;
  let blockedMilestones = 0;
  let upcomingMilestones = 0;

  for (const milestone of project.milestones) {
    const dueDate = parseISO(milestone.dueDate);
    const isDone = milestone.status === "complete";

    if (!isDone && isBefore(dueDate, now)) {
      overdueMilestones += 1;
    }

    if (milestone.status === "blocked") {
      blockedMilestones += 1;
    }

    if (!isDone && !isBefore(dueDate, now) && isBefore(dueDate, soon)) {
      upcomingMilestones += 1;
    }
  }

  const daysToTarget = differenceInCalendarDays(parseISO(project.targetDate), now);
  const blockerPenalty = project.blockers.length * 11;
  const overduePenalty = overdueMilestones * 22;
  const blockedPenalty = blockedMilestones * 24;
  const nearTermPenalty = upcomingMilestones * 8;
  const schedulePenalty = daysToTarget < 0 ? 30 : daysToTarget < 14 ? 12 : 0;
  const progressPenalty = Math.max(0, 60 - project.progress) * 0.6;

  const riskScore = clamp(
    Math.round(
      blockerPenalty +
        overduePenalty +
        blockedPenalty +
        nearTermPenalty +
        schedulePenalty +
        progressPenalty,
    ),
    0,
    100,
  );

  const driftDays = estimateDriftDays(project);
  const riskLevel = riskLevelFromScore(riskScore);

  const summary =
    driftDays > 0
      ? `${RISK_LABELS[riskLevel]}: projected to slip by ${driftDays} day${
          driftDays === 1 ? "" : "s"
        } unless blockers are cleared.`
      : `${RISK_LABELS[riskLevel]}: timeline is recoverable if upcoming milestones stay on track.`;

  return {
    projectId: project.id,
    riskScore,
    riskLevel,
    overdueMilestones,
    blockedMilestones,
    upcomingMilestones,
    driftDays,
    summary,
  };
}

export function analyzePortfolio(projects: Project[]): {
  generatedAt: string;
  portfolioRisk: RiskLevel;
  averageRiskScore: number;
  blockedProjects: number;
  analyses: ProjectHealthAnalysis[];
} {
  const analyses = projects.map(analyzeProjectHealth);
  const totalScore = analyses.reduce((sum, item) => sum + item.riskScore, 0);
  const averageRiskScore =
    analyses.length === 0 ? 0 : Math.round(totalScore / analyses.length);

  const blockedProjects = analyses.filter(
    (item) => item.blockedMilestones > 0 || item.overdueMilestones > 0,
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    portfolioRisk: riskLevelFromScore(averageRiskScore),
    averageRiskScore,
    blockedProjects,
    analyses,
  };
}
