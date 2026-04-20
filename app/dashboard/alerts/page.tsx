"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { AlertsPanel } from "@/components/AlertsPanel";
import type { Alert, Project } from "@/lib/types";

type AlertsResponse = {
  alerts: Alert[];
  projects: Project[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const url = refresh ? "/api/alerts?refresh=true" : "/api/alerts";
      const response = await fetch(url, { cache: "no-store" });
      const payload = (await response.json()) as AlertsResponse;

      if (!response.ok) {
        throw new Error("Unable to load alerts");
      }

      setAlerts(payload.alerts);
      setProjects(payload.projects);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function acknowledge(alertId: string): Promise<void> {
    const response = await fetch("/api/alerts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ alertId }),
    });

    if (response.ok) {
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert,
        ),
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Alerts</h2>
          <p className="mt-1 text-sm text-slate-400">
            Prioritized warnings from deadline analysis and integration webhooks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
        >
          Run fresh analysis
        </button>
      </section>

      {loading ? (
        <div className="flex items-center text-sm text-slate-400">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Loading alerts...
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {!loading ? (
        <AlertsPanel alerts={alerts} projects={projects} onAcknowledge={acknowledge} />
      ) : null}
    </div>
  );
}
