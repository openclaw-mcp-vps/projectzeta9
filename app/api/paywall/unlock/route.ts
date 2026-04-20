import { NextResponse } from "next/server";
import { z } from "zod";

import { setPaidAccessCookie } from "@/lib/paywall";
import { isCheckoutPaid } from "@/lib/store";

const unlockSchema = z.object({
  checkoutId: z.string().min(1)
});

export async function POST(request: Request): Promise<NextResponse> {
  const json = (await request.json()) as unknown;
  const parsed = unlockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "checkoutId is required" }, { status: 400 });
  }

  const checkoutId = parsed.data.checkoutId.trim();
  const paid = await isCheckoutPaid(checkoutId);

  if (!paid && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Checkout not confirmed yet. Wait for Lemon Squeezy webhook confirmation, then try again."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setPaidAccessCookie(response);
  return response;
}
