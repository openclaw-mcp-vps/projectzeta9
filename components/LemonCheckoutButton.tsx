"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (config: { eventHandler: (event: unknown) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
    createLemonSqueezy?: () => void;
  }
}

type LemonCheckoutButtonProps = {
  className?: string;
  label?: string;
};

export function LemonCheckoutButton({ className, label = "Unlock dashboard" }: LemonCheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const checkoutUrl = useMemo(() => {
    if (!productId) {
      return "";
    }

    return `https://checkout.lemonsqueezy.com/buy/${productId}?checkout[custom][source]=projectzeta9&checkout[custom][intent]=paywall`;
  }, [productId]);

  useEffect(() => {
    if (!window.createLemonSqueezy) {
      return;
    }

    window.createLemonSqueezy();

    window.LemonSqueezy?.Setup({
      eventHandler: async (event) => {
        const typedEvent = event as { event?: string; data?: Record<string, unknown> };

        if (typedEvent.event !== "Checkout.Success") {
          return;
        }

        const checkoutId =
          String(typedEvent.data?.id ?? typedEvent.data?.checkout_id ?? typedEvent.data?.identifier ?? "");

        if (!checkoutId) {
          return;
        }

        await fetch("/api/paywall/unlock", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ checkoutId })
        });

        router.push("/dashboard");
      }
    });
  }, [router]);

  const openCheckout = (): void => {
    if (!checkoutUrl) {
      return;
    }

    setIsLoading(true);

    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
    }

    window.LemonSqueezy?.Url.Open(checkoutUrl);

    setTimeout(() => setIsLoading(false), 900);
  };

  return (
    <Button
      className={className}
      size="lg"
      onClick={openCheckout}
      disabled={!checkoutUrl || isLoading}
      aria-label="Open Lemon Squeezy checkout"
    >
      {isLoading ? "Opening checkout..." : label}
    </Button>
  );
}
