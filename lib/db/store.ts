import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getPgPool } from "@/lib/db/client";
import { SCHEMA_SQL } from "@/lib/db/schema";
import {
  buildDefaultIntegrationState,
  type Alert,
  type AppData,
  type IntegrationProvider,
  type IntegrationState,
  type Milestone,
  type PendingCheckoutToken,
  type Project,
  INTEGRATION_PROVIDERS,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const DATA_FILE = path.join(process.cwd(), "data", "app-data.json");

let schemaReadyPromise: Promise<void> | null = null;
let fileWriteQueue = Promise.resolve();

type ProjectDraft = {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  targetDate: string;
  progress?: number;
  blockers?: string[];
  milestones?: Milestone[];
  metadata?: Partial<Project["metadata"]>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function buildSeedProjects(): Project[] {
  const now = new Date();

  return [
    {
      id: randomUUID(),
      name: "Onboarding Rewrite",
      slug: "onboarding-rewrite",
      description:
        "Revamp activation flow to cut setup time below 15 minutes for new developer teams.",
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      targetDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 19).toISOString(),
      progress: 62,
      riskLevel: "medium",
      blockers: [
        "Awaiting final security review for OAuth scope expansion.",
        "Analytics event naming conflicts between frontend and backend.",
      ],
      milestones: [
        {
          id: randomUUID(),
          title: "Finalize onboarding architecture",
          dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
          status: "complete",
          owner: "Alicia",
          completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
        {
          id: randomUUID(),
          title: "Ship API validation updates",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          status: "at_risk",
          owner: "Jon",
          notes: "Blocked by test fixture drift in CI.",
        },
        {
          id: randomUUID(),
          title: "Release migration guide",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 9).toISOString(),
          status: "planned",
          owner: "Priya",
        },
      ],
      metadata: {
        owner: "Alicia",
        team: "Growth",
        repoUrl: "https://github.com/acme/onboarding",
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      name: "Billing Reliability",
      slug: "billing-reliability",
      description:
        "Improve invoice generation and retry logic to prevent end-of-month support escalations.",
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 24).toISOString(),
      targetDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 11).toISOString(),
      progress: 47,
      riskLevel: "high",
      blockers: [
        "One flaky background worker still drops idempotency keys under load.",
      ],
      milestones: [
        {
          id: randomUUID(),
          title: "Replay failed invoices",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
          status: "blocked",
          owner: "Miguel",
          notes: "Needs queue throughput patch before rerun.",
        },
        {
          id: randomUUID(),
          title: "Deploy retry policy",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 6).toISOString(),
          status: "on_track",
          owner: "Nina",
        },
      ],
      metadata: {
        owner: "Nina",
        team: "Platform",
        linearProjectId: "PLAT-22",
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      name: "Mobile SDK v2",
      slug: "mobile-sdk-v2",
      description:
        "Deliver a unified iOS and Android SDK with stronger offline behavior for enterprise pilots.",
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      targetDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 31).toISOString(),
      progress: 35,
      riskLevel: "medium",
      blockers: [],
      milestones: [
        {
          id: randomUUID(),
          title: "Finalize offline queue contract",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
          status: "on_track",
          owner: "Marta",
        },
        {
          id: randomUUID(),
          title: "Beta with design partner",
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 18).toISOString(),
          status: "planned",
          owner: "Leo",
        },
      ],
      metadata: {
        owner: "Marta",
        team: "Mobile",
        notionPageId: "c7f7d996a13d4ad6b4b8fbf5141f0cdf",
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

function buildDefaultIntegrations(): Record<IntegrationProvider, IntegrationState> {
  return {
    github: buildDefaultIntegrationState("github"),
    linear: buildDefaultIntegrationState("linear"),
    notion: buildDefaultIntegrationState("notion"),
  };
}

function buildDefaultData(): AppData {
  return {
    projects: buildSeedProjects(),
    alerts: [],
    integrations: buildDefaultIntegrations(),
    pendingCheckoutTokens: [],
  };
}

function normalizeData(raw: Partial<AppData>): AppData {
  const integrations = buildDefaultIntegrations();

  for (const provider of INTEGRATION_PROVIDERS) {
    const existing = raw.integrations?.[provider];
    if (existing) {
      integrations[provider] = {
        ...buildDefaultIntegrationState(provider),
        ...existing,
      };
    }
  }

  return {
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    integrations,
    pendingCheckoutTokens: Array.isArray(raw.pendingCheckoutTokens)
      ? raw.pendingCheckoutTokens
      : [],
  };
}

async function queuedFileWrite(data: AppData): Promise<void> {
  fileWriteQueue = fileWriteQueue
    .then(() => fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8"))
    .catch(() => fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8"));

  await fileWriteQueue;
}

async function readFileData(): Promise<AppData> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = normalizeData(JSON.parse(raw) as Partial<AppData>);

    if (parsed.projects.length === 0) {
      const seeded = buildDefaultData();
      await queuedFileWrite(seeded);
      return seeded;
    }

    return parsed;
  } catch {
    const seeded = buildDefaultData();
    await queuedFileWrite(seeded);
    return seeded;
  }
}

async function writeFileData(data: AppData): Promise<void> {
  await queuedFileWrite(data);
}

async function ensurePgSchema(): Promise<void> {
  const pool = getPgPool();
  if (!pool) {
    return;
  }

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      for (const statement of SCHEMA_SQL) {
        await pool.query(statement);
      }

      const integrationRows = await pool.query("SELECT provider FROM integrations");
      const existing = new Set<string>(
        integrationRows.rows.map((row: { provider: string }) => row.provider),
      );

      const now = nowIso();
      for (const provider of INTEGRATION_PROVIDERS) {
        if (!existing.has(provider)) {
          const state = buildDefaultIntegrationState(provider);
          await pool.query(
            `
              INSERT INTO integrations
              (provider, connected, webhook_health, total_events, last_event_at, last_status, last_message, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              state.provider,
              state.connected,
              state.webhookHealth,
              state.totalEvents,
              state.lastEventAt ?? null,
              state.lastStatus ?? null,
              state.lastMessage ?? null,
              now,
            ],
          );
        }
      }

      const count = await pool.query<{ count: string }>(
        "SELECT COUNT(*)::text as count FROM projects",
      );

      if (Number(count.rows[0]?.count ?? "0") === 0) {
        for (const project of buildSeedProjects()) {
          await insertProjectPg(project);
        }
      }
    })();
  }

  await schemaReadyPromise;
}

function parsePgProject(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  start_date: string;
  target_date: string;
  progress: number;
  risk_level: Project["riskLevel"];
  blockers: string[];
  milestones: Milestone[];
  metadata: Project["metadata"];
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    startDate: new Date(row.start_date).toISOString(),
    targetDate: new Date(row.target_date).toISOString(),
    progress: Number(row.progress),
    riskLevel: row.risk_level,
    blockers: Array.isArray(row.blockers) ? row.blockers : [],
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    metadata: row.metadata,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function insertProjectPg(project: Project): Promise<void> {
  const pool = getPgPool();
  if (!pool) {
    return;
  }

  await pool.query(
    `
      INSERT INTO projects
      (id, name, slug, description, start_date, target_date, progress, risk_level, blockers, milestones, metadata, created_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        target_date = EXCLUDED.target_date,
        progress = EXCLUDED.progress,
        risk_level = EXCLUDED.risk_level,
        blockers = EXCLUDED.blockers,
        milestones = EXCLUDED.milestones,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `,
    [
      project.id,
      project.name,
      project.slug,
      project.description,
      project.startDate,
      project.targetDate,
      project.progress,
      project.riskLevel,
      JSON.stringify(project.blockers),
      JSON.stringify(project.milestones),
      JSON.stringify(project.metadata),
      project.createdAt,
      project.updatedAt,
    ],
  );
}

async function listPgProjects(): Promise<Project[]> {
  const pool = getPgPool();
  if (!pool) {
    return [];
  }

  await ensurePgSchema();
  const rows = await pool.query(
    `
      SELECT id, name, slug, description, start_date, target_date, progress, risk_level, blockers, milestones, metadata, created_at, updated_at
      FROM projects
      ORDER BY updated_at DESC
    `,
  );

  return rows.rows.map((row) => parsePgProject(row));
}

async function listFileProjects(): Promise<Project[]> {
  const data = await readFileData();
  return [...data.projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

function buildUniqueSlug(name: string, projects: Project[]): string {
  const base = slugify(name);
  const taken = new Set(projects.map((project) => project.slug));

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function hydrateProject(draft: ProjectDraft, existingProjects: Project[]): Project {
  const existing =
    draft.id !== undefined
      ? existingProjects.find((project) => project.id === draft.id)
      : undefined;

  const timestamp = nowIso();
  const projectId = existing?.id ?? draft.id ?? randomUUID();

  return {
    id: projectId,
    name: draft.name.trim(),
    slug:
      existing?.slug ??
      buildUniqueSlug(draft.name.trim() || "project", existingProjects),
    description: draft.description.trim(),
    startDate: draft.startDate,
    targetDate: draft.targetDate,
    progress: Math.max(0, Math.min(100, Math.round(draft.progress ?? existing?.progress ?? 0))),
    riskLevel: existing?.riskLevel ?? "medium",
    blockers: draft.blockers ?? existing?.blockers ?? [],
    milestones: draft.milestones ?? existing?.milestones ?? [],
    metadata: {
      owner: draft.metadata?.owner ?? existing?.metadata.owner ?? "Unassigned",
      team: draft.metadata?.team ?? existing?.metadata.team ?? "Engineering",
      repoUrl: draft.metadata?.repoUrl ?? existing?.metadata.repoUrl,
      linearProjectId:
        draft.metadata?.linearProjectId ?? existing?.metadata.linearProjectId,
      notionPageId: draft.metadata?.notionPageId ?? existing?.metadata.notionPageId,
    },
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function getProjects(): Promise<Project[]> {
  if (getPgPool()) {
    return listPgProjects();
  }

  return listFileProjects();
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return null;
    }

    await ensurePgSchema();
    const row = await pool.query(
      `
        SELECT id, name, slug, description, start_date, target_date, progress, risk_level, blockers, milestones, metadata, created_at, updated_at
        FROM projects
        WHERE id = $1
        LIMIT 1
      `,
      [projectId],
    );

    return row.rows[0] ? parsePgProject(row.rows[0]) : null;
  }

  const data = await readFileData();
  return data.projects.find((project) => project.id === projectId) ?? null;
}

export async function findProjectByHint(hint?: string): Promise<Project | null> {
  if (!hint) {
    return null;
  }

  const query = hint.toLowerCase();
  const projects = await getProjects();

  return (
    projects.find((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.slug.toLowerCase().includes(query) ||
        project.metadata.repoUrl?.toLowerCase().includes(query) ||
        project.metadata.linearProjectId?.toLowerCase().includes(query) ||
        project.metadata.notionPageId?.toLowerCase().includes(query)
      );
    }) ?? null
  );
}

export async function upsertProject(draft: ProjectDraft): Promise<Project> {
  const existingProjects = await getProjects();
  const project = hydrateProject(draft, existingProjects);

  if (getPgPool()) {
    await ensurePgSchema();
    await insertProjectPg(project);
    return project;
  }

  const data = await readFileData();
  const index = data.projects.findIndex((item) => item.id === project.id);

  if (index === -1) {
    data.projects.unshift(project);
  } else {
    data.projects[index] = project;
  }

  await writeFileData(data);
  return project;
}

export async function addProjectBlocker(
  projectId: string,
  blocker: string,
): Promise<Project | null> {
  const project = await getProjectById(projectId);
  if (!project) {
    return null;
  }

  const alreadyExists = project.blockers.some(
    (entry) => entry.toLowerCase() === blocker.toLowerCase(),
  );

  if (alreadyExists) {
    return project;
  }

  const updated = {
    ...project,
    blockers: [blocker, ...project.blockers],
    updatedAt: nowIso(),
  };

  if (getPgPool()) {
    await ensurePgSchema();
    await insertProjectPg(updated);
    return updated;
  }

  const data = await readFileData();
  const index = data.projects.findIndex((item) => item.id === projectId);
  if (index !== -1) {
    data.projects[index] = updated;
    await writeFileData(data);
  }

  return updated;
}

export async function getAlerts(): Promise<Alert[]> {
  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return [];
    }

    await ensurePgSchema();
    const rows = await pool.query<{
      id: string;
      project_id: string;
      severity: Alert["severity"];
      title: string;
      message: string;
      source: Alert["source"];
      acknowledged: boolean;
      created_at: string;
    }>(
      `
        SELECT id, project_id, severity, title, message, source, acknowledged, created_at
        FROM alerts
        ORDER BY created_at DESC
      `,
    );

    return rows.rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      severity: row.severity,
      title: row.title,
      message: row.message,
      source: row.source,
      acknowledged: row.acknowledged,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  const data = await readFileData();
  return [...data.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addAlerts(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) {
    return;
  }

  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return;
    }

    await ensurePgSchema();
    for (const alert of alerts) {
      await pool.query(
        `
          INSERT INTO alerts
          (id, project_id, severity, title, message, source, acknowledged, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `,
        [
          alert.id,
          alert.projectId,
          alert.severity,
          alert.title,
          alert.message,
          alert.source,
          alert.acknowledged,
          alert.createdAt,
        ],
      );
    }

    return;
  }

  const data = await readFileData();
  const existingIds = new Set(data.alerts.map((alert) => alert.id));
  const newAlerts = alerts.filter((alert) => !existingIds.has(alert.id));
  data.alerts = [...newAlerts, ...data.alerts];
  await writeFileData(data);
}

export async function acknowledgeAlert(alertId: string): Promise<Alert | null> {
  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return null;
    }

    await ensurePgSchema();
    const result = await pool.query<{
      id: string;
      project_id: string;
      severity: Alert["severity"];
      title: string;
      message: string;
      source: Alert["source"];
      acknowledged: boolean;
      created_at: string;
    }>(
      `
        UPDATE alerts
        SET acknowledged = TRUE
        WHERE id = $1
        RETURNING id, project_id, severity, title, message, source, acknowledged, created_at
      `,
      [alertId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      projectId: row.project_id,
      severity: row.severity,
      title: row.title,
      message: row.message,
      source: row.source,
      acknowledged: row.acknowledged,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  const data = await readFileData();
  const index = data.alerts.findIndex((alert) => alert.id === alertId);
  if (index === -1) {
    return null;
  }

  data.alerts[index] = {
    ...data.alerts[index],
    acknowledged: true,
  };

  await writeFileData(data);
  return data.alerts[index];
}

export async function getIntegrations(): Promise<
  Record<IntegrationProvider, IntegrationState>
> {
  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return buildDefaultIntegrations();
    }

    await ensurePgSchema();
    const rows = await pool.query<{
      provider: IntegrationProvider;
      connected: boolean;
      webhook_health: IntegrationState["webhookHealth"];
      total_events: number;
      last_event_at: string | null;
      last_status: string | null;
      last_message: string | null;
      updated_at: string;
    }>(
      `
        SELECT provider, connected, webhook_health, total_events, last_event_at, last_status, last_message, updated_at
        FROM integrations
      `,
    );

    const output = buildDefaultIntegrations();

    for (const row of rows.rows) {
      output[row.provider] = {
        provider: row.provider,
        connected: row.connected,
        webhookHealth: row.webhook_health,
        totalEvents: Number(row.total_events),
        lastEventAt: row.last_event_at ? new Date(row.last_event_at).toISOString() : undefined,
        lastStatus: row.last_status ?? undefined,
        lastMessage: row.last_message ?? undefined,
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    }

    return output;
  }

  const data = await readFileData();
  return data.integrations;
}

export async function recordIntegrationEvent(
  provider: IntegrationProvider,
  options: {
    connected?: boolean;
    status?: string;
    message?: string;
    health?: IntegrationState["webhookHealth"];
  },
): Promise<IntegrationState> {
  const timestamp = nowIso();

  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return buildDefaultIntegrationState(provider);
    }

    await ensurePgSchema();
    const existing = await pool.query<{
      provider: IntegrationProvider;
      connected: boolean;
      webhook_health: IntegrationState["webhookHealth"];
      total_events: number;
      last_event_at: string | null;
      last_status: string | null;
      last_message: string | null;
      updated_at: string;
    }>(
      `
        SELECT provider, connected, webhook_health, total_events, last_event_at, last_status, last_message, updated_at
        FROM integrations
        WHERE provider = $1
      `,
      [provider],
    );

    const current = existing.rows[0]
      ? {
          provider: existing.rows[0].provider,
          connected: existing.rows[0].connected,
          webhookHealth: existing.rows[0].webhook_health,
          totalEvents: Number(existing.rows[0].total_events),
          lastEventAt: existing.rows[0].last_event_at ?? undefined,
          lastStatus: existing.rows[0].last_status ?? undefined,
          lastMessage: existing.rows[0].last_message ?? undefined,
          updatedAt: existing.rows[0].updated_at,
        }
      : buildDefaultIntegrationState(provider);

    const next: IntegrationState = {
      ...current,
      provider,
      connected: options.connected ?? true,
      webhookHealth: options.health ?? "healthy",
      totalEvents: current.totalEvents + 1,
      lastStatus: options.status ?? current.lastStatus,
      lastMessage: options.message ?? current.lastMessage,
      lastEventAt: timestamp,
      updatedAt: timestamp,
    };

    await pool.query(
      `
        INSERT INTO integrations
        (provider, connected, webhook_health, total_events, last_event_at, last_status, last_message, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (provider)
        DO UPDATE SET
          connected = EXCLUDED.connected,
          webhook_health = EXCLUDED.webhook_health,
          total_events = EXCLUDED.total_events,
          last_event_at = EXCLUDED.last_event_at,
          last_status = EXCLUDED.last_status,
          last_message = EXCLUDED.last_message,
          updated_at = EXCLUDED.updated_at
      `,
      [
        provider,
        next.connected,
        next.webhookHealth,
        next.totalEvents,
        next.lastEventAt,
        next.lastStatus ?? null,
        next.lastMessage ?? null,
        next.updatedAt,
      ],
    );

    return next;
  }

  const data = await readFileData();
  const current = data.integrations[provider] ?? buildDefaultIntegrationState(provider);

  const next: IntegrationState = {
    ...current,
    provider,
    connected: options.connected ?? true,
    webhookHealth: options.health ?? "healthy",
    totalEvents: current.totalEvents + 1,
    lastStatus: options.status ?? current.lastStatus,
    lastMessage: options.message ?? current.lastMessage,
    lastEventAt: timestamp,
    updatedAt: timestamp,
  };

  data.integrations[provider] = next;
  await writeFileData(data);

  return next;
}

export async function storeCheckoutSuccessToken(
  token: string,
  email: string,
  expiresAt: string,
): Promise<void> {
  const payload: PendingCheckoutToken = {
    token,
    email,
    expiresAt,
    used: false,
    createdAt: nowIso(),
  };

  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return;
    }

    await ensurePgSchema();
    await pool.query(
      `
        INSERT INTO checkout_tokens (token, email, expires_at, used, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (token)
        DO UPDATE SET
          email = EXCLUDED.email,
          expires_at = EXCLUDED.expires_at,
          used = EXCLUDED.used,
          created_at = EXCLUDED.created_at
      `,
      [payload.token, payload.email, payload.expiresAt, payload.used, payload.createdAt],
    );
    return;
  }

  const data = await readFileData();
  data.pendingCheckoutTokens = data.pendingCheckoutTokens.filter(
    (entry) => entry.token !== token,
  );
  data.pendingCheckoutTokens.push(payload);
  await writeFileData(data);
}

export async function consumeCheckoutSuccessToken(
  token: string,
): Promise<{ email: string } | null> {
  if (getPgPool()) {
    const pool = getPgPool();
    if (!pool) {
      return null;
    }

    await ensurePgSchema();
    const result = await pool.query<{
      email: string;
      expires_at: string;
      used: boolean;
    }>(
      `
        SELECT email, expires_at, used
        FROM checkout_tokens
        WHERE token = $1
      `,
      [token],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    if (row.used || new Date(row.expires_at).getTime() < Date.now()) {
      return null;
    }

    await pool.query(
      `
        UPDATE checkout_tokens
        SET used = TRUE
        WHERE token = $1
      `,
      [token],
    );

    return { email: row.email };
  }

  const data = await readFileData();
  const index = data.pendingCheckoutTokens.findIndex(
    (entry) => entry.token === token,
  );

  if (index === -1) {
    return null;
  }

  const entry = data.pendingCheckoutTokens[index];

  if (entry.used || new Date(entry.expiresAt).getTime() < Date.now()) {
    return null;
  }

  data.pendingCheckoutTokens[index] = {
    ...entry,
    used: true,
  };

  await writeFileData(data);

  return { email: entry.email };
}
