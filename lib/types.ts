export type IntegrationSource = "github" | "linear" | "manual";

export type ProjectStatus = "on_track" | "at_risk" | "off_track";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  blockerCount: number;
}

export interface Project {
  id: string;
  externalId?: string;
  source: IntegrationSource;
  name: string;
  owner: string;
  status: ProjectStatus;
  healthScore: number;
  updatedAt: string;
  milestones: Milestone[];
}

export interface ProjectAlert {
  id: string;
  projectId?: string;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
}

export interface ProjectInput {
  id?: string;
  externalId?: string;
  source: IntegrationSource;
  name: string;
  owner: string;
  status: ProjectStatus;
  healthScore: number;
  milestones: Omit<Milestone, "id">[];
}
