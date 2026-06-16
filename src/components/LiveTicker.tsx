"use client";

import { useLiveQuotes, type QuotesRecord } from "@/hooks/useLiveQuotes";
import { fmtPrice, fmtPct } from "@/lib/format";

/* Tickertejp som faktiskt tickar — ren CSS-loop (46s) som pausar på hover,
   med kurserna live via /api/quotes. Saknas data för en symbol döljs den. */
export default function LiveTicker({
  order,
  initial,
}: {
  order: string[];
  initial: QuotesRecord;
}) {
  const { quotes } = useLiveQuotes(order, initial);

  const items = order
    .map((sym) => quotes[sym])
    .filter((q): q is NonNullable<typeof q> => !!q);

  if (items.length === 0) return null;

  const doubled = [...items, ...items]; // dubblerat ⇒ sömlös −50%-loop

  return (
    <div
      aria-hidden="true"
      className="group relative flex h-[46px] items-center overflow-hidden border-t border-hair bg-[rgba(13,11,8,.6)] backdrop-blur-[10px]"
    >
      <div className="flex animate-tick whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {doubled.map((q, i) => (
          <span
            key={i}
            className="inline-flex items-baseline gap-[9px] px-[26px] font-mono text-[11.5px] tracking-[.06em]"
          >
            <b className="font-bold text-ivory">{q.ticker}</b>
            <span className="tabular-nums text-ivory-2">{fmtPrice(q.price)}</span>
            <span className={`tabular-nums ${q.changePct >= 0 ? "text-sage" : "text-verm"}`}>
              {fmtPct(q.changePct)}
            </span>
            <span className="text-[#3A332A]">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
