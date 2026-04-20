import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPaidAccess } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/alerts", label: "Alerts" },
  { href: "/dashboard/integrations", label: "Integrations" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const allowed = await hasPaidAccess();

  if (!allowed) {
    redirect("/?paywall=locked");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              ProjectZeta9
            </p>
            <h1 className="text-lg font-semibold text-slate-100">
              Deadline Radar Dashboard
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
