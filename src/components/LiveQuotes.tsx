"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLiveQuotes, type QuotesRecord } from "@/hooks/useLiveQuotes";
import type { Quote } from "@/lib/quote";
import { fmtPrice, fmtSigned, fmtPct } from "@/lib/format";

/* Delad pollning: EN poll-loop per provider, alla LivePrice läser samma data.
   Lägg providern runt en sektion och strö ut <LivePrice> där priser visas. */
const Ctx = createContext<{ quotes: QuotesRecord; marketOpen: boolean } | null>(null);

export function LiveQuotesProvider({
  tickers,
  initial,
  children,
}: {
  tickers: string[];
  initial: QuotesRecord;
  children: React.ReactNode;
}) {
  const live = useLiveQuotes(tickers, initial);
  return <Ctx.Provider value={live}>{children}</Ctx.Provider>;
}

export function useLiveQuote(ticker: string): Quote | undefined {
  const ctx = useContext(Ctx);
  return ctx?.quotes[ticker];
}

/** Kort färgblänk när ett värde ändras: grönt upp, vermillion ner. */
function useFlash(value: number | undefined): "up" | "down" | null {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current !== undefined && value !== undefined && value !== prev.current) {
      setFlash(value > prev.current ? "up" : "down");
      const id = setTimeout(() => setFlash(null), 900);
      prev.current = value;
      return () => clearTimeout(id);
    }
    prev.current = value;
  }, [value]);

  return flash;
}

/**
 * Inline-pris som uppdateras live. Visar SSR-/initialvärdet direkt och byter
 * mjukt när pollningen ger nytt. `fallback` används om vi saknar data helt.
 */
export function LivePrice({
  ticker,
  initial,
  showDelta = false,
  className = "",
}: {
  ticker: string;
  initial?: Quote;
  showDelta?: boolean;
  className?: string;
}) {
  const live = useLiveQuote(ticker);
  const q = live ?? initial;
  const flash = useFlash(q?.price);

  if (!q) return null;

  const flashCls =
    flash === "up"
      ? "text-sage"
      : flash === "down"
        ? "text-verm"
        : "";

  return (
    <span className={`inline-flex items-baseline gap-2.5 transition-colors duration-300 ${className}`}>
      <span className={`tabular-nums transition-colors duration-300 ${flashCls}`}>
        {fmtPrice(q.price)}
      </span>
      {showDelta && (
        <span
          className={`tabular-nums text-[12px] font-medium ${q.changePct >= 0 ? "text-sage" : "text-verm"}`}
        >
          {fmtPct(q.changePct)}
        </span>
      )}
    </span>
  );
}

/** Bara procentförändringen — för t.ex. bolagskort. */
export function LivePct({
  ticker,
  initial,
  className = "",
}: {
  ticker: string;
  initial?: Quote;
  className?: string;
}) {
  const live = useLiveQuote(ticker);
  const q = live ?? initial;
  if (!q) return null;
  return (
    <span className={`tabular-nums ${q.changePct >= 0 ? "text-sage" : "text-verm"} ${className}`}>
      {fmtPct(q.changePct)}
    </span>
  );
}

/** Bara prisdeltat (signerat absolut + procent) — för bolagshuvudet. */
export function LiveDelta({
  ticker,
  initial,
  className = "",
}: {
  ticker: string;
  initial?: Quote;
  className?: string;
}) {
  const live = useLiveQuote(ticker);
  const q = live ?? initial;
  if (!q) return null;
  return (
    <span className={`tabular-nums ${q.changePct >= 0 ? "text-sage" : "text-verm"} ${className}`}>
      {fmtSigned(q.change)}&nbsp;&nbsp;{fmtPct(q.changePct)}
    </span>
  );
}
