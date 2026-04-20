import type { Metadata } from "next";
import Link from "next/link";

import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { UnlockPurchaseForm } from "@/components/UnlockPurchaseForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ProjectZeta9 pricing for engineering managers who need unified project health visibility and proactive deadline alerts."
};

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="mt-3 text-[#cbd5e1]">
          Built for 10-50 person engineering teams that need confidence across 3-8 concurrent initiatives.
        </p>
      </div>

      {params.locked ? (
        <Card className="mb-5 border-[#92400e] bg-[#1f2937]/70">
          <CardHeader>
            <CardTitle className="text-[#fdba74]">Dashboard access requires an active subscription.</CardTitle>
            <CardDescription>
              Complete checkout to unlock project health monitoring and alert automation.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="bg-[#0f172a]/70">
        <CardHeader>
          <CardTitle className="text-2xl">ProjectZeta9 Pro</CardTitle>
          <CardDescription>
            Unified milestone tracking, webhook ingestion, and smart risk alerts for one flat monthly fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-4xl font-semibold">
            $15 <span className="text-lg text-[#94a3b8]">/ month</span>
          </p>
          <ul className="space-y-2 text-sm text-[#cbd5e1]">
            <li>Unlimited tracked projects and milestones</li>
            <li>GitHub + Linear webhook endpoints</li>
            <li>Automated deadline drift scoring</li>
            <li>Alert history feed with severity tagging</li>
            <li>Integration setup guide for technical leads</li>
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LemonCheckoutButton className="w-full sm:w-auto" label="Open secure checkout" />
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
              View onboarding flow
            </Link>
          </div>
          <UnlockPurchaseForm className="border-t border-[#1f2937] pt-4" />
        </CardContent>
      </Card>
    </main>
  );
}
