import Bull from "bull";

import { env } from "@/lib/env";

type DeadlineJob = {
  projectId: string;
  queuedAt: string;
};

let deadlineQueue: Bull.Queue<DeadlineJob> | null = null;

function parseRedisConfig(redisUrl: string): Bull.QueueOptions["redis"] {
  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password || undefined,
    db: parsed.pathname ? Number(parsed.pathname.replace("/", "")) || 0 : 0,
    tls: parsed.protocol === "rediss:" ? {} : undefined
  };
}

export function getDeadlineQueue(): Bull.Queue<DeadlineJob> | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!deadlineQueue) {
    deadlineQueue = new Bull<DeadlineJob>("projectzeta9-deadline-analysis", {
      redis: parseRedisConfig(env.REDIS_URL)
    });
  }

  return deadlineQueue;
}

export async function enqueueDeadlineAnalysis(projectIds: string[]): Promise<number> {
  const queue = getDeadlineQueue();
  if (!queue) {
    return 0;
  }

  await Promise.all(
    projectIds.map((projectId) =>
      queue.add(
        {
          projectId,
          queuedAt: new Date().toISOString()
        },
        {
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: "fixed",
            delay: 1500
          }
        }
      )
    )
  );

  return projectIds.length;
}
