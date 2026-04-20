import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  ChartNoAxesCombined,
  FileWarning,
  GitBranch,
  Layers3,
} from "lucide-react";

import { CheckoutButton } from "@/components/CheckoutButton";

const painPoints = [
  {
    title: "Status meetings still miss real blockers",
    description:
      "Managers spend hours collecting updates, but critical dependency issues surface after sprint plans are already committed.",
    icon: FileWarning,
  },
  {
    title: "Tool fragmentation hides delivery risk",
    description:
      "Signals are scattered across GitHub, Linear, and Notion. Context switches slow teams down and delay decisions.",
    icon: Layers3,
  },
  {
    title: "Deadline drift compounds silently",
    description:
      "Without early alerts, project slip looks manageable until milestones stack up and release dates collapse.",
    icon: CalendarClock,
  },
];

const solution = [
  {
    title: "Unified project health scoreboard",
    description:
      "Track progress, blockers, and deadline confidence across every active initiative in one board.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Webhook integrations for real-time context",
    description:
      "Ingest GitHub, Linear, and Notion updates instantly so risk is visible the moment it appears.",
    icon: GitBranch,
  },
  {
    title: "Smart alerts with actionable next steps",
    description:
      "ProjectZeta9 flags overdue milestones and blocked work with concrete follow-ups before timelines derail.",
    icon: BellRing,
  },
];

const faqs = [
  {
    question: "How quickly can a team get value from ProjectZeta9?",
    answer:
      "Most teams connect their first integrations in under 30 minutes and start receiving blocker alerts the same day.",
  },
  {
    question: "Who is this best for?",
    answer:
      "Engineering managers at 10-50 person startups juggling multiple projects and coordinating across several delivery tools.",
  },
  {
    question: "What does the $15/mo plan include?",
    answer:
      "Unlimited projects, all integration endpoints, deadline analysis jobs, and alerting for your full engineering portfolio.",
  },
  {
    question: "Can we use this without replacing existing workflows?",
    answer:
      "Yes. ProjectZeta9 complements GitHub, Linear, and Notion. You keep your current process while gaining a health layer on top.",
  },
];

export default function HomePage() {
  return (
    <div className="pb-16">
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/90">project_zeta_9</p>
            <p className="text-sm text-slate-400">Micro SaaS for deadline control</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              ProjectZeta9
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-100 sm:text-5xl">
              Stop timeline drift before it burns your sprint plan.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              ProjectZeta9 automates milestone tracking across GitHub, Linear, and Notion so engineering managers can spot blockers early and keep 3-8 concurrent projects on schedule.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">Built for 10-50 person startups</span>
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">Real-time webhook alerts</span>
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">$15/mo flat pricing</span>
            </div>
          </div>
          <CheckoutButton />
        </section>

        <section className="py-10">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-100">Why teams lose visibility</h2>
            <p className="text-sm text-slate-400">23% of engineering time still disappears into status reporting.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {painPoints.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <Icon className="h-5 w-5 text-rose-300" />
                  <h3 className="mt-3 text-lg font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold text-slate-100">How ProjectZeta9 fixes it</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {solution.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-3 text-lg font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold text-slate-100">Pricing</h2>
          <div className="mt-4 max-w-lg rounded-3xl border border-emerald-500/35 bg-emerald-500/8 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Starter</p>
            <p className="mt-2 text-4xl font-bold text-slate-100">
              $15<span className="text-lg font-medium text-slate-300">/mo</span>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              For engineering managers who need a single source of truth across distributed tools.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Unlimited tracked projects and milestones</li>
              <li>Webhook endpoints for GitHub, Linear, and Notion</li>
              <li>Automated deadline analysis and priority alerts</li>
              <li>Dashboard access for your management workflow</li>
            </ul>
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold text-slate-100">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <h3 className="text-base font-semibold text-slate-100">{item.question}</h3>
                <p className="mt-1.5 text-sm text-slate-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
