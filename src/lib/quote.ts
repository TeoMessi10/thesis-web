/* Delad kurs-typ — fri från server-beroenden så den kan importeras både i
   server-kod (market.ts) och i klientkomponenter/hooks. */
export interface Quote {
  ticker: string; // vår ticker (t.ex. VOLV-B)
  price: number;
  change: number;
  changePct: number;
}

/** Det servern skickar till klienten via /api/quotes. */
export interface QuoteSnapshot {
  quotes: Record<string, Quote>;
  marketOpen: boolean;
  asOf: number; // epoch ms när datan senast hämtades från EODHD (0 = ingen data)
  refreshMs: number; // hur länge servern tänker behålla cachen (hint till klienten)
}
