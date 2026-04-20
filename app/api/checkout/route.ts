import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildAccessCookieOptions,
  createAccessToken,
  createCheckoutToken,
  verifyCheckoutToken,
} from "@/lib/auth";
import {
  consumeCheckoutSuccessToken,
  storeCheckoutSuccessToken,
} from "@/lib/db/store";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  email: z.string().email(),
});

async function createCheckoutUrlWithSdk(options: {
  storeId: string;
  productId: string;
  email: string;
  successUrl: string;
  successToken: string;
}): Promise<string | null> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const lemon = await import("@lemonsqueezy/lemonsqueezy.js");

    (lemon as unknown as { lemonSqueezySetup: (args: { apiKey: string }) => void }).lemonSqueezySetup(
      {
        apiKey,
      },
    );

    const sdk = lemon as unknown as {
      createCheckout: (...args: unknown[]) => Promise<{
        data?: {
          data?: {
            attributes?: {
              url?: string;
            };
          };
        };
      }>;
    };

    const response = await sdk.createCheckout(
      options.storeId,
      Number(options.productId),
      {
        checkoutOptions: {
          embed: true,
          media: false,
          logo: true,
        },
        checkoutData: {
          email: options.email,
          custom: {
            success_token: options.successToken,
            source: "projectzeta9",
          },
          successUrl: options.successUrl,
        },
        productOptions: {
          redirectUrl: options.successUrl,
        },
      },
    );

    return response?.data?.data?.attributes?.url ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
    const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

    if (!storeId || !productId) {
      return NextResponse.json(
        {
          error:
            "Lemon Squeezy environment variables are missing. Configure store and product IDs.",
        },
        { status: 500 },
      );
    }

    const successToken = createCheckoutToken(parsed.data.email);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString();

    await storeCheckoutSuccessToken(successToken, parsed.data.email, expiresAt);

    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin") ?? requestUrl.origin;
    const successUrl = `${origin}/api/checkout?success_token=${encodeURIComponent(successToken)}`;

    const sdkUrl = await createCheckoutUrlWithSdk({
      storeId,
      productId,
      email: parsed.data.email,
      successUrl,
      successToken,
    });

    if (sdkUrl) {
      return NextResponse.json({ checkoutUrl: sdkUrl });
    }

    const fallbackUrl = new URL(`https://app.lemonsqueezy.com/checkout/buy/${productId}`);
    fallbackUrl.searchParams.set("embed", "1");
    fallbackUrl.searchParams.set("checkout[email]", parsed.data.email);
    fallbackUrl.searchParams.set("checkout[custom][success_token]", successToken);
    fallbackUrl.searchParams.set("checkout[custom][source]", "projectzeta9");
    fallbackUrl.searchParams.set("checkout[success_url]", successUrl);

    return NextResponse.json({ checkoutUrl: fallbackUrl.toString() });
  } catch {
    return NextResponse.json(
      { error: "Unable to initialize checkout" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const successToken = url.searchParams.get("success_token");

  if (!successToken) {
    return NextResponse.redirect(new URL("/?checkout=missing", request.url));
  }

  const verified = verifyCheckoutToken(successToken);
  if (!verified) {
    return NextResponse.redirect(new URL("/?checkout=invalid", request.url));
  }

  const consumed = await consumeCheckoutSuccessToken(successToken);
  if (!consumed) {
    return NextResponse.redirect(new URL("/?checkout=expired", request.url));
  }

  const accessToken = createAccessToken(consumed.email);
  const options = buildAccessCookieOptions();

  const response = NextResponse.redirect(new URL("/dashboard?welcome=1", request.url));
  response.cookies.set({
    ...options,
    value: accessToken,
  });

  return response;
}
