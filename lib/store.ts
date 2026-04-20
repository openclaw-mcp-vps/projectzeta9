import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Pool } from "pg";

import { env } from "@/lib/env";
import type { Milestone, Project, ProjectAlert, ProjectInput } from "@/lib/types";

type StoredCheckout = {
  checkoutId: string;
  email?: string;
  activatedAt: string;
};

type FileStore = {
  projects: Project[];
  alerts: ProjectAlert[];
  paidCheckouts: StoredCheckout[];
};

const dataFile = path.join(process.cwd(), "data", "projectzeta9.json");

let pool: Pool | null = null;
let schemaReady = false;

function nowIso(): string {
  return new Date().toISOString();
}

function demoProjects(): Project[] {
  const generatedAt = nowIso();

  return [
    {
      id: "demo-github-platform-reliability",
      externalId: "acme/platform-reliability",
      source: "github",
      name: "Platform Reliability",
      owner: "infra-team",
      status: "at_risk",
      healthScore: 62,
      updatedAt: generatedAt,
      milestones: [
        {
          id: "demo-github-platform-reliability-m1",
          title: "Deploy canary rollback automation",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
          completed: false,
          blockerCount: 2
        },
        {
          id: "demo-github-platform-reliability-m2",
          title: "Close P1 incident backlog",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
          completed: false,
          blockerCount: 4
        }
      ]
    },
    {
      id: "demo-linear-growth-onboarding",
      externalId: "GROWTH-42",
      source: "linear",
      name: "Growth Onboarding Revamp",
      owner: "growth-pod",
      status: "on_track",
      healthScore: 85,
      updatedAt: generatedAt,
      milestones: [
        {
          id: "demo-linear-growth-onboarding-m1",
          title: "Ship guided setup checklist",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
          completed: true,
          blockerCount: 0
        },
        {
          id: "demo-linear-growth-onboarding-m2",
          title: "Launch activation experiments",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 11).toISOString(),
          completed: false,
          blockerCount: 1
        }
      ]
    },
    {
      id: "demo-manual-enterprise-readiness",
      source: "manual",
      name: "Enterprise Readiness",
      owner: "product-leadership",
      status: "off_track",
      healthScore: 44,
      updatedAt: generatedAt,
      milestones: [
        {
          id: "demo-manual-enterprise-readiness-m1",
          title: "SOC2 controls evidence complete",
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          completed: false,
          blockerCount: 3
        }
      ]
    }
  ];
}

function defaultStore(): FileStore {
  return {
    projects: demoProjects(),
    alerts: [],
    paidCheckouts: []
  };
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(dataFile, "utf-8");
    return JSON.parse(raw) as FileStore;
  } catch {
    const store = defaultStore();
    await writeFileStore(store);
    return store;
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf-8");
}

function getPool(): Pool | null {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 3_000
    });
  }

  return pool;
}

async function ensurePgSchema(): Promise<void> {
  const connection = getPool();
  if (!connection || schemaReady) {
    return;
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      external_id TEXT,
      source TEXT NOT NULL,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL,
      health_score INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await connection.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS projects_external_source_idx
    ON projects (external_id, source)
    WHERE external_id IS NOT NULL;
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_date TIMESTAMPTZ NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      blocker_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS paid_checkouts (
      checkout_id TEXT PRIMARY KEY,
      email TEXT,
      activated_at TIMESTAMPTZ NOT NULL
    );
  `);

  schemaReady = true;
}

function normalizeMilestones(projectId: string, milestones: Omit<Milestone, "id">[]): Milestone[] {
  return milestones.map((milestone, index) => ({
    id: `${projectId}-m${index + 1}-${milestone.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    ...milestone
  }));
}

function normalizeProjectInput(input: ProjectInput): Project {
  const id = input.id ?? (input.externalId ? `${input.source}:${input.externalId}` : randomUUID());

  return {
    id,
    externalId: input.externalId,
    source: input.source,
    name: input.name,
    owner: input.owner,
    status: input.status,
    healthScore: input.healthScore,
    updatedAt: nowIso(),
    milestones: normalizeMilestones(id, input.milestones)
  };
}

async function seedPgIfEmpty(): Promise<void> {
  const connection = getPool();
  if (!connection) {
    return;
  }

  const countResult = await connection.query<{ total: string }>("SELECT COUNT(*)::TEXT AS total FROM projects");
  const total = Number(countResult.rows[0]?.total ?? 0);

  if (total > 0) {
    return;
  }

  for (const project of demoProjects()) {
    await saveProject({
      id: project.id,
      externalId: project.externalId,
      source: project.source,
      name: project.name,
      owner: project.owner,
      status: project.status,
      healthScore: project.healthScore,
      milestones: project.milestones.map((milestone) => ({
        title: milestone.title,
        dueDate: milestone.dueDate,
        completed: milestone.completed,
        blockerCount: milestone.blockerCount
      }))
    });
  }
}

export async function getProjects(): Promise<Project[]> {
  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      await seedPgIfEmpty();

      const projectsResult = await connection.query<{
        id: string;
        external_id: string | null;
        source: string;
        name: string;
        owner: string;
        status: Project["status"];
        health_score: number;
        updated_at: Date;
      }>(
        "SELECT id, external_id, source, name, owner, status, health_score, updated_at FROM projects ORDER BY updated_at DESC"
      );

      const milestonesResult = await connection.query<{
        id: string;
        project_id: string;
        title: string;
        due_date: Date;
        completed: boolean;
        blocker_count: number;
      }>(
        "SELECT id, project_id, title, due_date, completed, blocker_count FROM milestones ORDER BY due_date ASC"
      );

      const milestonesByProject = new Map<string, Milestone[]>();

      for (const row of milestonesResult.rows) {
        const list = milestonesByProject.get(row.project_id) ?? [];
        list.push({
          id: row.id,
          title: row.title,
          dueDate: row.due_date.toISOString(),
          completed: row.completed,
          blockerCount: row.blocker_count
        });
        milestonesByProject.set(row.project_id, list);
      }

      return projectsResult.rows.map((row) => ({
        id: row.id,
        externalId: row.external_id ?? undefined,
        source: row.source as Project["source"],
        name: row.name,
        owner: row.owner,
        status: row.status,
        healthScore: row.health_score,
        updatedAt: row.updated_at.toISOString(),
        milestones: milestonesByProject.get(row.id) ?? []
      }));
    } catch (error) {
      console.error("Postgres unavailable, using file store", error);
    }
  }

  const store = await readFileStore();
  return store.projects;
}

export async function saveProject(input: ProjectInput): Promise<Project> {
  const project = normalizeProjectInput(input);
  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      const client = await connection.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `
            INSERT INTO projects (id, external_id, source, name, owner, status, health_score, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id)
            DO UPDATE SET
              external_id = EXCLUDED.external_id,
              source = EXCLUDED.source,
              name = EXCLUDED.name,
              owner = EXCLUDED.owner,
              status = EXCLUDED.status,
              health_score = EXCLUDED.health_score,
              updated_at = EXCLUDED.updated_at
          `,
          [
            project.id,
            project.externalId ?? null,
            project.source,
            project.name,
            project.owner,
            project.status,
            project.healthScore,
            project.updatedAt
          ]
        );

        await client.query("DELETE FROM milestones WHERE project_id = $1", [project.id]);

        for (const milestone of project.milestones) {
          await client.query(
            `
              INSERT INTO milestones (id, project_id, title, due_date, completed, blocker_count)
              VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
              milestone.id,
              project.id,
              milestone.title,
              milestone.dueDate,
              milestone.completed,
              milestone.blockerCount
            ]
          );
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return project;
    } catch (error) {
      console.error("Failed to persist project in Postgres, using file store", error);
    }
  }

  const store = await readFileStore();
  const existingIndex = store.projects.findIndex((entry) => entry.id === project.id);

  if (existingIndex >= 0) {
    store.projects[existingIndex] = project;
  } else {
    store.projects.unshift(project);
  }

  await writeFileStore(store);

  return project;
}

export async function getAlerts(limit = 25): Promise<ProjectAlert[]> {
  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      const result = await connection.query<{
        id: string;
        project_id: string | null;
        severity: ProjectAlert["severity"];
        message: string;
        created_at: Date;
      }>(
        "SELECT id, project_id, severity, message, created_at FROM alerts ORDER BY created_at DESC LIMIT $1",
        [limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        projectId: row.project_id ?? undefined,
        severity: row.severity,
        message: row.message,
        createdAt: row.created_at.toISOString()
      }));
    } catch (error) {
      console.error("Failed to read alerts from Postgres, using file store", error);
    }
  }

  const store = await readFileStore();
  return store.alerts.slice(0, limit);
}

export async function saveAlerts(
  entries: Omit<ProjectAlert, "id" | "createdAt">[]
): Promise<ProjectAlert[]> {
  if (entries.length === 0) {
    return [];
  }

  const alerts: ProjectAlert[] = entries.map((entry) => ({
    id: randomUUID(),
    projectId: entry.projectId,
    severity: entry.severity,
    message: entry.message,
    createdAt: nowIso()
  }));

  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      const client = await connection.connect();

      try {
        await client.query("BEGIN");

        for (const alert of alerts) {
          await client.query(
            "INSERT INTO alerts (id, project_id, severity, message, created_at) VALUES ($1, $2, $3, $4, $5)",
            [alert.id, alert.projectId ?? null, alert.severity, alert.message, alert.createdAt]
          );
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return alerts;
    } catch (error) {
      console.error("Failed to write alerts to Postgres, using file store", error);
    }
  }

  const store = await readFileStore();
  store.alerts = [...alerts, ...store.alerts].slice(0, 200);
  await writeFileStore(store);

  return alerts;
}

export async function markCheckoutPaid(checkoutId: string, email?: string): Promise<void> {
  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      await connection.query(
        `
          INSERT INTO paid_checkouts (checkout_id, email, activated_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (checkout_id)
          DO UPDATE SET email = EXCLUDED.email, activated_at = EXCLUDED.activated_at
        `,
        [checkoutId, email ?? null, nowIso()]
      );
      return;
    } catch (error) {
      console.error("Failed to write checkout status to Postgres, using file store", error);
    }
  }

  const store = await readFileStore();
  const existingIndex = store.paidCheckouts.findIndex((entry) => entry.checkoutId === checkoutId);
  const checkout: StoredCheckout = {
    checkoutId,
    email,
    activatedAt: nowIso()
  };

  if (existingIndex >= 0) {
    store.paidCheckouts[existingIndex] = checkout;
  } else {
    store.paidCheckouts.push(checkout);
  }

  await writeFileStore(store);
}

export async function isCheckoutPaid(checkoutId: string): Promise<boolean> {
  const connection = getPool();

  if (connection) {
    try {
      await ensurePgSchema();
      const result = await connection.query<{ checkout_id: string }>(
        "SELECT checkout_id FROM paid_checkouts WHERE checkout_id = $1 LIMIT 1",
        [checkoutId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Failed to read checkout status from Postgres, using file store", error);
    }
  }

  const store = await readFileStore();
  return store.paidCheckouts.some((entry) => entry.checkoutId === checkoutId);
}
