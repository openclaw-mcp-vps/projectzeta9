export const PROJECTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  target_date TIMESTAMPTZ NOT NULL,
  progress INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  blockers JSONB NOT NULL,
  milestones JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
`;

export const ALERTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);
`;

export const INTEGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS integrations (
  provider TEXT PRIMARY KEY,
  connected BOOLEAN NOT NULL,
  webhook_health TEXT NOT NULL,
  total_events INTEGER NOT NULL,
  last_event_at TIMESTAMPTZ,
  last_status TEXT,
  last_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);
`;

export const CHECKOUT_TOKENS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS checkout_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);
`;

export const SCHEMA_SQL = [
  PROJECTS_TABLE_SQL,
  ALERTS_TABLE_SQL,
  INTEGRATIONS_TABLE_SQL,
  CHECKOUT_TOKENS_TABLE_SQL,
];
