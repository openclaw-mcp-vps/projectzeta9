import { AlertTriangle, FolderKanban, Radar, Sparkles } from "lucide-react";

import { PortfolioRiskChart } from "@/components/PortfolioRiskChart";
import { ProjectHealthCard } from "@/components/ProjectHealthCard";
import { analyzePortfolio } from "@/lib/deadline-analyzer";
import { runDeadlineAnalysisJob } from "@/lib/alert-engine";
import { getAlerts, getProjects } from "@/lib/db/store";

export default async function DashboardHomePage() {
  await runDeadlineAnalysisJob();

  const [projects, alerts] = await Promise.all([getProjects(), getAlerts()]);
  const portfolio = analyzePortfolio(projects);

  const riskCounts = portfolio.analyses.reduce(
    (acc, analysis) => {
      acc[analysis.riskLevel] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 },
  );

  const analysisByProject = new Map(
    portfolio.analyses.map((analysis) => [analysis.projectId, analysis]),
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Risk</p>
          <p className="mt-2 flex items-center text-3xl font-semibold text-slate-100">
            <Radar className="mr-2 h-7 w-7 text-cyan-300" />
            {portfolio.averageRiskScore}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Portfolio Risk</p>
          <p className="mt-2 flex items-center text-3xl font-semibold text-slate-100">
            <Sparkles className="mr-2 h-7 w-7 text-emerald-300" />
            {portfolio.portfolioRisk}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tracked Projects</p>
          <p className="mt-2 flex items-center text-3xl font-semibold text-slate-100">
            <FolderKanban className="mr-2 h-7 w-7 text-indigo-300" />
            {projects.length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Alerts</p>
          <p className="mt-2 flex items-center text-3xl font-semibold text-slate-100">
            <AlertTriangle className="mr-2 h-7 w-7 text-amber-300" />
            {alerts.filter((alert) => !alert.acknowledged).length}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Risk Distribution</h2>
          <p className="mt-1 text-sm text-slate-400">
            Live view of project risk states from the latest deadline analysis job.
          </p>
          <PortfolioRiskChart
            low={riskCounts.low}
            medium={riskCounts.medium}
            high={riskCounts.high}
            critical={riskCounts.critical}
          />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Recent Alert Snapshot</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-300">
            {alerts.slice(0, 5).map((alert) => (
              <li key={alert.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="font-semibold text-slate-100">{alert.title}</p>
                <p className="mt-1 text-slate-400">{alert.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Project Health</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const analysis = analysisByProject.get(project.id);

            if (!analysis) {
              return null;
            }

            return (
              <ProjectHealthCard key={project.id} project={project} analysis={analysis} />
            );
          })}
        </div>
      </section>
    </div>
  );
}
