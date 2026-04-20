"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UnlockPurchaseFormProps = {
  className?: string;
};

export function UnlockPurchaseForm({ className }: UnlockPurchaseFormProps) {
  const router = useRouter();
  const [checkoutId, setCheckoutId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function unlock(): Promise<void> {
    if (!checkoutId) {
      setMessage("Paste your Lemon Squeezy checkout ID to unlock access.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/paywall/unlock", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ checkoutId })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not unlock account");
      }

      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not unlock account");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-[#cbd5e1]" htmlFor="checkout-id">
        Already paid? Enter your checkout ID
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="checkout-id"
          value={checkoutId}
          onChange={(event) => setCheckoutId(event.target.value)}
          placeholder="e.g. 12345678"
          className="sm:flex-1"
        />
        <Button onClick={unlock} disabled={isLoading} variant="secondary">
          {isLoading ? "Validating..." : "Unlock"}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-[#fca5a5]">{message}</p> : null}
    </div>
  );
}
