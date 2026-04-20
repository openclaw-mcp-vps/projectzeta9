"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { LoaderCircle, Rocket } from "lucide-react";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open?: (url: string) => void;
      };
    };
  }
}

export function CheckoutButton() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.includes("@") && email.includes(".") && !loading;
  }, [email, loading]);

  async function startCheckout(): Promise<void> {
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Unable to create checkout session.");
      }

      setNotice("Checkout session ready. Complete payment to unlock the dashboard.");

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(payload.checkoutUrl);
      } else {
        window.location.href = payload.checkoutUrl;
      }
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unexpected checkout error.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      <label htmlFor="checkout-email" className="mb-2 block text-sm font-medium text-slate-300">
        Work email
      </label>
      <input
        id="checkout-email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="manager@startup.com"
        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none ring-cyan-400/50 transition focus:ring-2"
      />
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void startCheckout()}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Starting checkout...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-4 w-4" />
            Unlock ProjectZeta9 for $15/mo
          </>
        )}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      {notice ? <p className="mt-2 text-xs text-cyan-200">{notice}</p> : null}
      <p className="mt-2 text-[11px] text-slate-500">
        Secure checkout is powered by Lemon Squeezy.
      </p>
    </div>
  );
}
