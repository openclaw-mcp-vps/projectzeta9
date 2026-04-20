"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RunAlertCycleButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  async function run(): Promise<void> {
    setIsRunning(true);
    setResultMessage("");

    try {
      const response = await fetch("/api/alerts", {
        method: "POST"
      });

      const payload = (await response.json()) as { created?: number; queuedJobs?: number; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to run alert cycle");
      }

      setResultMessage(
        `Alert cycle complete. ${payload.created ?? 0} alert(s) generated, ${payload.queuedJobs ?? 0} async job(s) queued.`
      );
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "Unable to run alert cycle");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={run} variant="outline" disabled={isRunning}>
        {isRunning ? "Running analysis..." : "Run deadline analysis"}
      </Button>
      {resultMessage ? <p className="text-sm text-[#93c5fd]">{resultMessage}</p> : null}
    </div>
  );
}
