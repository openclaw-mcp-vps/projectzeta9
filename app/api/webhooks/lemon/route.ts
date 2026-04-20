import crypto from "crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { markCheckoutPaid } from "@/lib/store";

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyLemonSignature(rawBody: string, header: string | null): boolean {
  if (!env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return true;
  }

  if (!header) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.LEMON_SQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return safeCompare(expected, header);
}

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
      };
    };
  };

  const eventName = payload.meta?.event_name ?? "";

  if (["order_created", "order_paid", "subscription_created"].includes(eventName)) {
    const checkoutId = String(payload.data?.id ?? "");
    if (checkoutId) {
      await markCheckoutPaid(checkoutId, payload.data?.attributes?.user_email);
    }
  }

  return NextResponse.json({ ok: true });
}
