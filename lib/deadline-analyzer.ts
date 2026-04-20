import { differenceInCalendarDays, isBefore, parseISO } from "date-fns";

import type { Milestone, Project, ProjectStatus } from "@/lib/types";

function milestoneRisk(milestone: Milestone): number {
  if (milestone.completed) {
    return 0;
  }

  const dueDate = parseISO(milestone.dueDate);
  const daysRemaining = differenceInCalendarDays(dueDate, new Date());

  let risk = 10;

  if (daysRemaining <= 0) {
    risk += 60;
  } else if (daysRemaining <= 3) {
    risk += 35;
  } else if (daysRemaining <= 7) {
    risk += 20;
  }

  risk += Math.min(milestone.blockerCount * 8, 30);

  return Math.min(risk, 100);
}

export function computeHealthScore(milestones: Milestone[]): number {
  if (milestones.length === 0) {
    return 92;
  }

  const completionRate =
    milestones.filter((milestone) => milestone.completed).length / milestones.length;
  const avgRisk =
    milestones.reduce((sum, milestone) => sum + milestoneRisk(milestone), 0) /
    milestones.length;

  const scoreFromCompletion = Math.round(completionRate * 60);
  const scoreFromRisk = Math.max(0, 40 - Math.round(avgRisk * 0.4));

  return Math.max(0, Math.min(100, scoreFromCompletion + scoreFromRisk));
}

export function statusFromHealth(healthScore: number): ProjectStatus {
  if (healthScore >= 75) {
    return "on_track";
  }

  if (healthScore >= 50) {
    return "at_risk";
  }

  return "off_track";
}

export function analyzeProjectHealth(project: Project): {
  status: ProjectStatus;
  healthScore: number;
  lateMilestones: number;
  highRiskMilestones: number;
} {
  const lateMilestones = project.milestones.filter(
    (milestone) => !milestone.completed && isBefore(parseISO(milestone.dueDate), new Date())
  ).length;

  const highRiskMilestones = project.milestones.filter(
    (milestone) => milestoneRisk(milestone) >= 45
  ).length;

  const healthScore = computeHealthScore(project.milestones);

  return {
    status: statusFromHealth(healthScore),
    healthScore,
    lateMilestones,
    highRiskMilestones
  };
}
