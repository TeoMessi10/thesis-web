import { NextResponse } from "next/server";
import { getQuoteSnapshot } from "@/lib/market";
import type { Quote } from "@/lib/quote";

/* Proxy mot EODHD som håller nyckeln kvar på servern. Klienten pollar den här
   var ~30:e sekund, men EODHD träffas bara när den delade servercachen är
   inaktuell (se market.ts) — så pollningsfrekvensen är frikopplad från
   dagsbudgeten. Svaret cachas aldrig i webbläsaren; servern styr färskheten. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const snap = await getQuoteSnapshot();

  let quotes: Record<string, Quote> = snap.quotes;
  const filter = new URL(request.url).searchParams.get("tickers");
  if (filter) {
    const want = new Set(
      filter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    quotes = Object.fromEntries(Object.entries(snap.quotes).filter(([t]) => want.has(t)));
  }

  return NextResponse.json(
    { quotes, marketOpen: snap.marketOpen, asOf: snap.asOf, refreshMs: snap.refreshMs },
    { headers: { "Cache-Control": "no-store" } },
  );
}
