import Link from "next/link";

import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const faq = [
  {
    question: "How does ProjectZeta9 detect schedule drift?",
    answer:
      "It combines milestone due dates, blocker volume, issue throughput, and cross-tool update cadence to calculate a live health score per project."
  },
  {
    question: "Can this replace status meetings?",
    answer:
      "Teams usually shorten weekly status meetings by 30-50% because the dashboard already surfaces milestones, risks, and ownership context."
  },
  {
    question: "What startup stage is this built for?",
    answer:
      "ProjectZeta9 is designed for post-Series A engineering teams with 10-50 people juggling several launches at once."
  }
];

const features = [
  {
    title: "Unified project health",
    description:
      "Track every initiative in one board with objective health scoring sourced from GitHub, Linear, and team-entered milestones."
  },
  {
    title: "Predictive deadline analysis",
    description:
      "Spot at-risk milestones days before a deadline slips by factoring blocker count, overdue work, and completion velocity."
  },
  {
    title: "Actionable alert engine",
    description:
      "Notify the right owner when projects drift off course so fixes happen early instead of during fire-drill standups."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="rounded-2xl border border-[#1f2937] bg-[#111827]/60 p-6 sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-[#38bdf8]/40 bg-[#0b1220] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
            project_zeta_9
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Project health visibility for engineering teams scaling faster than their process.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#cbd5e1] sm:text-lg">
            ProjectZeta9 automates milestone tracking and deadline management so managers stop chasing updates and developers stop context-switching between Slack, Jira, and spreadsheets.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LemonCheckoutButton label="Start monitoring today - $15/mo" className="w-full sm:w-auto" />
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
              View live dashboard
            </Link>
          </div>
          <div className="mt-8 grid gap-4 text-sm text-[#cbd5e1] sm:grid-cols-3">
            <p>
              <span className="block text-2xl font-semibold text-[#f8fafc]">23%</span>
              engineering time wasted on status updates
            </p>
            <p>
              <span className="block text-2xl font-semibold text-[#f8fafc]">3-8</span>
              concurrent projects per startup team
            </p>
            <p>
              <span className="block text-2xl font-semibold text-[#f8fafc]">10 min</span>
              average setup to first health signal
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full bg-[#0f172a]/70">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-[#0f172a]/70">
            <CardHeader>
              <CardTitle>The problem</CardTitle>
              <CardDescription>
                Remote execution made project visibility worse. Managers are flying blind while contributors lose hours to manual updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#cbd5e1]">
              <p>Status docs lag reality, so blockers surface after timelines already slipped.</p>
              <p>Tool sprawl fragments ownership context across GitHub issues, Linear cycles, and Notion plans.</p>
              <p>Leads spend meetings collecting updates instead of removing delivery risk.</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0f172a]/70">
            <CardHeader>
              <CardTitle>The outcome</CardTitle>
              <CardDescription>
                One dashboard for project health, one alert stream for critical drift, and one source of truth for milestone confidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#cbd5e1]">
              <p>Cut status overhead while improving deadline predictability across all active projects.</p>
              <p>Surface cross-team blockers early with severity-ranked alerts tied to owners.</p>
              <p>Keep shipping cadence stable as your startup scales from informal coordination to repeatable delivery.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <Card className="bg-[#111827]/80">
          <CardHeader>
            <CardTitle>Simple pricing for fast-moving startup teams</CardTitle>
            <CardDescription>
              One plan, all core features included. Start with one team, expand as your roadmap grows.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-4xl font-semibold">$15<span className="text-lg text-[#94a3b8]">/month</span></p>
              <p className="mt-2 text-sm text-[#cbd5e1]">Includes dashboard, webhook ingestion, alerting, and milestone timeline analytics.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <LemonCheckoutButton className="w-full sm:w-auto" />
              <Link href="/pricing" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}>
                Compare plan details
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-semibold">FAQ</h2>
        <div className="space-y-3">
          {faq.map((item) => (
            <Card key={item.question} className="bg-[#0f172a]/70">
              <CardHeader>
                <CardTitle className="text-lg">{item.question}</CardTitle>
                <CardDescription>{item.answer}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
