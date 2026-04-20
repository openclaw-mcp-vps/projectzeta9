import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID: z.string().default(""),
  NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID: z.string().default(""),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().default(""),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ALERT_FROM_EMAIL: z.string().email().default("alerts@projectzeta9.com"),
  GITHUB_WEBHOOK_SECRET: z.string().default(""),
  LINEAR_WEBHOOK_SECRET: z.string().default("")
});

const fallback = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID: "",
  NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID: "",
  LEMON_SQUEEZY_WEBHOOK_SECRET: "",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ALERT_FROM_EMAIL: process.env.ALERT_FROM_EMAIL ?? "alerts@projectzeta9.com",
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  LINEAR_WEBHOOK_SECRET: process.env.LINEAR_WEBHOOK_SECRET ?? ""
};

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID,
  NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID,
  LEMON_SQUEEZY_WEBHOOK_SECRET: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ALERT_FROM_EMAIL: process.env.ALERT_FROM_EMAIL,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  LINEAR_WEBHOOK_SECRET: process.env.LINEAR_WEBHOOK_SECRET
});

if (!parsed.success) {
  console.warn("Invalid environment configuration. Falling back to safe defaults.");
}

export const env = parsed.success ? parsed.data : envSchema.parse(fallback);
