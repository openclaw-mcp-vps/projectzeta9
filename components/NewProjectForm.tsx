"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type NewProjectFormProps = {
  onCreated?: () => void;
};

export function NewProjectForm({ onCreated }: NewProjectFormProps) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [milestone, setMilestone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submitForm(): Promise<void> {
    if (!name || !owner || !milestone || !dueDate) {
      setMessage("Add project name, owner, milestone title, and due date.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name,
          owner,
          source: "manual",
          milestones: [
            {
              title: milestone,
              dueDate,
              blockerCount: 0
            }
          ]
        })
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Unable to create project");
      }

      setMessage("Project added. Dashboard risk metrics are now tracking this milestone.");
      setName("");
      setOwner("");
      setMilestone("");
      setDueDate("");
      onCreated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="bg-[#0f172a]/70">
      <CardHeader>
        <CardTitle>Create Your First Tracked Project</CardTitle>
        <CardDescription>
          Start with one project and milestone, then let webhook updates keep it fresh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          aria-label="Project name"
        />
        <Input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Owner team or person"
          aria-label="Project owner"
        />
        <Textarea
          value={milestone}
          onChange={(event) => setMilestone(event.target.value)}
          placeholder="Primary milestone to monitor"
          aria-label="Milestone title"
          className="min-h-[80px]"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Milestone due date"
        />
        <Button className="w-full" onClick={submitForm} disabled={isSubmitting}>
          {isSubmitting ? "Saving project..." : "Add project to dashboard"}
        </Button>
        {message ? <p className="text-sm text-[#93c5fd]">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
