"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote, QuoteSnapshot } from "@/lib/quote";

export type QuotesRecord = Record<string, Quote>;

/* Pollintervall (klient → /api/quotes). Frikopplat från EODHD-anropen, som
   styrs server-side. Kan överstyras med NEXT_PUBLIC_QUOTES_POLL_* vid behov. */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const POLL_OPEN_MS = num(process.env.NEXT_PUBLIC_QUOTES_POLL_OPEN_MS, 30_000);
const POLL_CLOSED_MS = num(process.env.NEXT_PUBLIC_QUOTES_POLL_CLOSED_MS, 5 * 60_000);

/**
 * Pollar /api/quotes och håller kurserna färska utan helsidladdning.
 * - Startar från `initial` (SSR-datan) så inget hoppar vid första render.
 * - Snabbare puls under börstid, långsammare när stängt.
 * - Pausar när fliken är dold; hämtar direkt när den blir synlig igen.
 */
export function useLiveQuotes(tickers: string[], initial: QuotesRecord = {}) {
  const [quotes, setQuotes] = useState<QuotesRecord>(initial);
  const [marketOpen, setMarketOpen] = useState(true);
  const tickersKey = tickers.join(",");

  /* Senaste värden i ref så vi kan jämföra utan att trigga om effekten. */
  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(poll, POLL_CLOSED_MS);
        return;
      }
      let nextMs = POLL_CLOSED_MS;
      try {
        const res = await fetch(`/api/quotes?tickers=${encodeURIComponent(tickersKey)}`, {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const data: QuoteSnapshot = await res.json();
          setMarketOpen(data.marketOpen);
          nextMs = data.marketOpen ? POLL_OPEN_MS : POLL_CLOSED_MS;
          setQuotes((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const [t, q] of Object.entries(data.quotes)) {
              const old = prev[t];
              if (!old || old.price !== q.price || old.changePct !== q.changePct) {
                next[t] = q;
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
      } catch {
        // Nätverksfel ⇒ behåll förra värdet, försök igen senare.
      }
      if (!cancelled) timer = setTimeout(poll, nextMs);
    };

    /* SSR-datan visas direkt; första pollningen sker efter ett intervall. */
    timer = setTimeout(poll, POLL_OPEN_MS);

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tickersKey]);

  return { quotes, marketOpen };
}
