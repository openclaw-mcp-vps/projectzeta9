"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Link2, ShieldAlert } from "lucide-react";

import type { IntegrationProvider, IntegrationState } from "@/lib/types";

const integrationLabels: Record<IntegrationProvider, string> = {
  github: "GitHub",
  linear: "Linear",
  notion: "Notion",
};

const webhookPaths: Record<IntegrationProvider, string> = {
  github: "/api/webhooks/github",
  linear: "/api/webhooks/linear",
  notion: "/api/webhooks/notion",
};

export function IntegrationSetup({
  integrations,
}: {
  integrations: Record<IntegrationProvider, IntegrationState>;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(path: string): Promise<void> {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(Object.keys(integrations) as IntegrationProvider[]).map((provider) => {
        const integration = integrations[provider];
        const webhookPath = webhookPaths[provider];

        return (
          <article
            key={provider}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                {integrationLabels[provider]}
              </h3>
              {integration.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Waiting
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p>
                Health: <strong className="text-slate-100">{integration.webhookHealth}</strong>
              </p>
              <p>
                Events captured: <strong className="text-slate-100">{integration.totalEvents}</strong>
              </p>
              <p>
                Last status: <strong className="text-slate-100">{integration.lastStatus ?? "N/A"}</strong>
              </p>
              <p className="text-xs text-slate-400">
                {integration.lastMessage ?? "No webhook payload received yet."}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Webhook Endpoint
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-cyan-300">{webhookPath}</p>
                <button
                  type="button"
                  onClick={() => void copy(webhookPath)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-400/60"
                >
                  {copied === webhookPath ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === webhookPath ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <a
              href={`https://${provider}.com`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs text-cyan-200 hover:text-cyan-100"
            >
              <Link2 className="h-3.5 w-3.5" />
              Open {integrationLabels[provider]} setup docs
            </a>
          </article>
        );
      })}
    </div>
  );
}
