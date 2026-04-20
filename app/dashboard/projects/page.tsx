"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, PlusCircle } from "lucide-react";

import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { ProjectHealthCard } from "@/components/ProjectHealthCard";
import type { Project, ProjectHealthAnalysis } from "@/lib/types";

type ProjectsResponse = {
  projects: Project[];
  portfolio: {
    analyses: ProjectHealthAnalysis[];
  };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [analyses, setAnalyses] = useState<ProjectHealthAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [team, setTeam] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const analysisByProject = useMemo(() => {
    return new Map(analyses.map((analysis) => [analysis.projectId, analysis]));
  }, [analyses]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const payload = (await response.json()) as ProjectsResponse;

      if (!response.ok) {
        throw new Error("Unable to load projects.");
      }

      setProjects(payload.projects);
      setAnalyses(payload.portfolio.analyses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProject(): Promise<void> {
    setSaving(true);
    setError(null);

    try {
      const now = new Date();
      const due = new Date(targetDate);

      const milestoneAnchor = new Date(
        now.getTime() + Math.max(1, (due.getTime() - now.getTime()) / 3),
      );

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          startDate: now.toISOString(),
          targetDate: due.toISOString(),
          progress: 0,
          metadata: {
            owner,
            team,
          },
          milestones: [
            {
              title: "Define scope and dependencies",
              dueDate: milestoneAnchor.toISOString(),
              status: "planned",
              owner,
              notes:
                "Capture assumptions, dependencies, and integration touch points before implementation.",
            },
            {
              title: "Beta milestone",
              dueDate: due.toISOString(),
              status: "planned",
              owner,
              notes:
                "Ship beta to internal stakeholders and review release blockers.",
            },
          ],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to create project");
      }

      setName("");
      setDescription("");
      setOwner("");
      setTeam("");
      setTargetDate("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="text-xl font-semibold text-slate-100">Create Project</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add a new initiative and let ProjectZeta9 monitor deadline drift automatically.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Project name"
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm"
          />
          <input
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm"
          />
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Project owner"
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm"
          />
          <input
            value={team}
            onChange={(event) => setTeam(event.target.value)}
            placeholder="Team"
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this project delivers and why it matters"
            className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={
            saving || !name || !description || !owner || !team || !targetDate
          }
          onClick={() => void createProject()}
          className="mt-3 inline-flex items-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {saving ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Saving project...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Project
            </>
          )}
        </button>
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      </section>

      {loading ? (
        <div className="flex items-center text-sm text-slate-400">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Loading projects...
        </div>
      ) : (
        <section className="space-y-4">
          {projects.map((project) => {
            const analysis = analysisByProject.get(project.id);
            if (!analysis) {
              return null;
            }

            return (
              <div key={project.id} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <ProjectHealthCard project={project} analysis={analysis} />
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-base font-semibold text-slate-100">Milestone Timeline</h3>
                  <MilestoneTimeline milestones={project.milestones} />
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
