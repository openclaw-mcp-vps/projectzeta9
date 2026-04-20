import { createClient, type RedisClientType } from "redis";

import { env } from "@/lib/env";

let redisClient: RedisClientType | null = null;
let hasConnectionError = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!env.REDIS_URL || hasConnectionError) {
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on("error", () => {
      hasConnectionError = true;
    });
  }

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error("Redis connection failed", error);
      hasConnectionError = true;
      return null;
    }
  }

  return redisClient;
}

export async function publishRealtimeEvent(channel: string, payload: unknown): Promise<void> {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  await client.publish(channel, JSON.stringify(payload));
}
