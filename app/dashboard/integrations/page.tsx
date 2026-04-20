import { IntegrationSetup } from "@/components/IntegrationSetup";
import { getIntegrations } from "@/lib/db/store";

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-slate-100">Integrations</h2>
        <p className="mt-1 text-sm text-slate-400">
          Connect your existing tools and stream activity into ProjectZeta9's deadline analysis pipeline.
        </p>
      </section>

      <IntegrationSetup integrations={integrations} />

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-slate-100">Setup checklist</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Add each webhook URL to your tool settings.</li>
          <li>Enable event notifications for issue status, project health, and milestone updates.</li>
          <li>Send a test event and confirm the health status changes to healthy.</li>
          <li>Review alert output in the Alerts tab and assign owners to blockers.</li>
        </ol>
      </section>
    </div>
  );
}
