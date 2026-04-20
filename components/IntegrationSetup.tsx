import { Github, Link2, Workflow } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

const integrations = [
  {
    key: "github",
    icon: Github,
    title: "GitHub Webhooks",
    description:
      "Send repository and issue activity to keep milestone health in sync with engineering reality.",
    endpoint: "/api/webhooks/github",
    events: "issues, pull_request, project_card"
  },
  {
    key: "linear",
    icon: Workflow,
    title: "Linear Webhooks",
    description:
      "Stream issue state changes and due-date updates to detect deadline drift before sprint review.",
    endpoint: "/api/webhooks/linear",
    events: "Issue, Project, Cycle"
  },
  {
    key: "notion",
    icon: Link2,
    title: "Notion Tracking",
    description:
      "Attach roadmap and meeting-note links so every milestone has source context and owner notes.",
    endpoint: "/api/projects",
    events: "Manual sync"
  }
];

export function IntegrationSetup() {
  return (
    <Card className="bg-[#0f172a]/70">
      <CardHeader>
        <CardTitle>Integration Setup</CardTitle>
        <CardDescription>
          Connect your existing workflow tools in under 10 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const webhookUrl = `${env.NEXT_PUBLIC_APP_URL}${integration.endpoint}`;

          return (
            <div key={integration.key} className="rounded-lg border border-[#1f2937] bg-[#0b1220] p-4">
              <div className="mb-2 flex items-center gap-2 text-[#e2e8f0]">
                <Icon className="h-4 w-4 text-[#38bdf8]" />
                <p className="font-semibold">{integration.title}</p>
              </div>
              <p className="mb-2 text-sm text-[#94a3b8]">{integration.description}</p>
              <p className="text-xs text-[#64748b]">Events: {integration.events}</p>
              <code className="mt-2 block overflow-x-auto rounded bg-[#020617] p-2 text-xs text-[#93c5fd]">
                {webhookUrl}
              </code>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
