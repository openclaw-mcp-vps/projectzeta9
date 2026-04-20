import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { IntegrationSetup } from "@/components/IntegrationSetup";
import { NewProjectForm } from "@/components/NewProjectForm";
import { hasPaidAccess } from "@/lib/paywall";

export const metadata: Metadata = {
  title: "Onboarding",
  description:
    "Connect GitHub and Linear webhooks, create your first tracked milestone, and activate ProjectZeta9 monitoring in minutes."
};

export default async function OnboardingPage() {
  const paid = await hasPaidAccess();

  if (!paid) {
    redirect("/pricing?locked=1");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-bold">Onboarding</h1>
        <p className="mt-2 max-w-3xl text-[#cbd5e1]">
          Connect your delivery tools, add one milestone-driven project, and start getting drift alerts without changing your team workflow.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <IntegrationSetup />
        <NewProjectForm />
      </div>
    </main>
  );
}
