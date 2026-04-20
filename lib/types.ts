export const INTEGRATION_PROVIDERS = ["github", "linear", "notion"] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type MilestoneStatus =
  | "planned"
  | "on_track"
  | "at_risk"
  | "blocked"
  | "complete";

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
  owner: string;
  notes?: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  targetDate: string;
  progress: number;
  riskLevel: RiskLevel;
  blockers: string[];
  milestones: Milestone[];
  metadata: {
    repoUrl?: string;
    linearProjectId?: string;
    notionPageId?: string;
    owner: string;
    team: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  projectId: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  source: "deadline-analyzer" | "github" | "linear" | "notion" | "system";
  acknowledged: boolean;
  createdAt: string;
}

export interface IntegrationState {
  provider: IntegrationProvider;
  connected: boolean;
  webhookHealth: "healthy" | "stale" | "error" | "unknown";
  totalEvents: number;
  lastEventAt?: string;
  lastStatus?: string;
  lastMessage?: string;
  updatedAt: string;
}

export interface PendingCheckoutToken {
  token: string;
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface AppData {
  projects: Project[];
  alerts: Alert[];
  integrations: Record<IntegrationProvider, IntegrationState>;
  pendingCheckoutTokens: PendingCheckoutToken[];
}

export interface IntegrationSignal {
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  projectHint?: string;
  blocker?: string;
}

export interface ProjectHealthAnalysis {
  projectId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  overdueMilestones: number;
  blockedMilestones: number;
  upcomingMilestones: number;
  driftDays: number;
  summary: string;
}

export function buildDefaultIntegrationState(
  provider: IntegrationProvider,
): IntegrationState {
  return {
    provider,
    connected: false,
    webhookHealth: "unknown",
    totalEvents: 0,
    updatedAt: new Date().toISOString(),
  };
}
