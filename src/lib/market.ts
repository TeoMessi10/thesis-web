/**
 * Börsdata via EODHD — körs ENBART på servern (server components + route handlers).
 * Nyckeln (EODHD_API_KEY i .env.local) saknar NEXT_PUBLIC_-prefix och får
 * aldrig nå webbläsaren. Importera ALDRIG den här modulen som *värde* i en
 * "use client"-komponent — använd `import type` eller hämta data via /api/quotes.
 *
 * BUDGET: gratisplanen tillåter ~20 anrop/dygn. Därför:
 *  - Alla realtidskurser hämtas i ETT batchat anrop (hela TRACKED-listan) och
 *    delas via en in-memory-cache mellan SSR och alla pollande klienter.
 *  - Cachen förnyas marknadsmedvetet: ofta under börstid, sällan när stängt.
 *  - En hård dagskvot (EODHD_DAILY_BUDGET) räknar BÅDE kurs- och historikanrop.
 *  - Klienten pollar /api/quotes (billigt, träffar cachen) — inte EODHD direkt.
 *
 * Misslyckade anrop ger tom map/null så att UI:t döljer prisblock istället för
 * att visa felaktiga siffror.
 */

import type { Quote, QuoteSnapshot } from "./quote";
import { spendBudget } from "./eodhd-budget";

export type { Quote, QuoteSnapshot } from "./quote";
export type { ChartData } from "./quote-chart";
export { buildChart } from "./quote-chart";
export { fmtPrice, fmtSigned, fmtPct } from "./format";

const BASE = "https://eodhd.com/api";

/* Alla symboler appen visar — hämtas i ETT anrop så att tape, nav, dashboard
   och bolagssidor delar samma cachade svar. Lägg till nya bolag här (eller, på
   sikt, hämta listan från databasen) så täcks de av samma enda anrop. */
const TRACKED = [
  "OMXS30",
  "VOLV-B",
  "ERIC-B",
  "INVE-B",
  "ATCO-A",
  "SEB-A",
  "HM-B",
  "EVO",
  "SAND",
  "ABB",
];

/* ---- Konfiguration (env med säkra defaultvärden som håller sig under 20/dygn) ---- */
const envInt = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
/* Hur ofta kurscachen får förnyas mot EODHD. Under börstid: ~90 min ⇒ ≤ ~6
   anrop på en 8,5 h handelsdag — lämnar utrymme för nyheter (5/bolag) inom
   dagsbudgeten. När stängt: 6 h (kursen rör sig ändå inte). */
const REFRESH_OPEN_MS = envInt(process.env.EODHD_REFRESH_OPEN_MS, 90 * 60_000);
const REFRESH_CLOSED_MS = envInt(process.env.EODHD_REFRESH_CLOSED_MS, 6 * 60 * 60_000);
/* Historik (EOD) ändras en gång per dygn — cacha länge. */
const HISTORY_TTL_MS = envInt(process.env.EODHD_HISTORY_TTL_MS, 12 * 60 * 60_000);
/* Strypning av nya försök efter ett misslyckat anrop (skyddar budgeten). */
const MIN_RETRY_MS = envInt(process.env.EODHD_MIN_RETRY_MS, 60_000);

/* ---- Symbolmappning ---- */
/** Vår ticker → EODHD-symbol. Bolagen i databasen är Stockholmsnoterade. */
function toSymbol(ticker: string): string {
  if (ticker === "OMXS30") return "OMXS30.INDX";
  return `${ticker}.ST`;
}
function fromSymbol(code: string): string {
  return code.replace(/\.(ST|INDX)$/, "");
}

/* ---- Marknadstider (Stockholm, mån–fre 09:00–17:30) ---- */
export function isMarketOpen(now: Date = new Date()): boolean {
  const tz = "Europe/Stockholm";
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
  if (weekday === "Sat" || weekday === "Sun") return false;
  const hm = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = hm.split(":").map(Number);
  const mins = h * 60 + m;
  return mins >= 9 * 60 && mins <= 17 * 60 + 30;
}

/* ---- Realtidskurser: en delad, budgetstyrd cache ---- */
interface EodRealtime {
  code?: string;
  close?: number | string;
  change?: number | string;
  change_p?: number | string;
}

let quoteCache: { quotes: Map<string, Quote>; asOf: number } | null = null;
let lastAttempt = 0;
let inflight: Promise<void> | null = null;

async function fetchTrackedFromEodhd(): Promise<Map<string, Quote> | null> {
  const key = process.env.EODHD_API_KEY;
  if (!key) return null;

  const [first, ...rest] = TRACKED.map(toSymbol);
  const params = new URLSearchParams({ api_token: key, fmt: "json" });
  if (rest.length > 0) params.set("s", rest.join(","));
  const url = `${BASE}/real-time/${encodeURIComponent(first)}?${params}`;

  try {
    /* Vi cachar själva (in-memory) — låt Next inte dubbelcacha. */
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data: EodRealtime | EodRealtime[] = await res.json();
    const list = Array.isArray(data) ? data : [data];
    const map = new Map<string, Quote>();
    for (const q of list) {
      const price = Number(q.close);
      // EODHD svarar "NA" för okända symboler — hoppa över dem.
      if (!q.code || !Number.isFinite(price)) continue;
      const change = Number(q.change);
      const pct = Number(q.change_p);
      const ticker = fromSymbol(q.code);
      map.set(ticker, {
        ticker,
        price,
        change: Number.isFinite(change) ? change : 0,
        changePct: Number.isFinite(pct) ? pct : 0,
      });
    }
    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}

/** Hämtar en hel kurs-snapshot (alla TRACKED), delad mellan SSR och /api/quotes.
   EODHD anropas bara när cachen är inaktuell, budgeten räcker och inget anrop
   nyligen misslyckats — oavsett hur många klienter som pollar samtidigt. */
export async function getQuoteSnapshot(): Promise<QuoteSnapshot> {
  const open = isMarketOpen();
  const interval = open ? REFRESH_OPEN_MS : REFRESH_CLOSED_MS;
  const now = Date.now();

  const fresh = quoteCache !== null && now - quoteCache.asOf < interval;
  const recentlyTried = now - lastAttempt < MIN_RETRY_MS;

  if (!fresh && !recentlyTried) {
    if (!inflight) {
      inflight = (async () => {
        if (!spendBudget()) return; // kvot slut ⇒ behåll befintlig cache
        lastAttempt = Date.now();
        const map = await fetchTrackedFromEodhd();
        if (map) quoteCache = { quotes: map, asOf: Date.now() };
      })().finally(() => {
        inflight = null;
      });
    }
    await inflight;
  }

  const quotes: Record<string, Quote> = {};
  if (quoteCache) for (const [k, v] of quoteCache.quotes) quotes[k] = v;
  return { quotes, marketOpen: open, asOf: quoteCache?.asOf ?? 0, refreshMs: interval };
}

/** Realtidskurser för en delmängd tickers (SSR-kompatibel — returnerar Map). */
export async function getQuotes(tickers: string[]): Promise<Map<string, Quote>> {
  const snap = await getQuoteSnapshot();
  const out = new Map<string, Quote>();
  for (const t of tickers) {
    const q = snap.quotes[t];
    if (q) out.set(t, q);
  }
  return out;
}

/* ---- Historik (EOD): in-memory-cache + samma dagsbudget ---- */
const historyCache = new Map<string, { closes: number[]; asOf: number }>();

/** Dagliga stängningskurser för de senaste `months` månaderna. */
export async function getPriceHistory(ticker: string, months = 6): Promise<number[] | null> {
  const key = process.env.EODHD_API_KEY;
  if (!key) return null;

  const cacheKey = `${ticker}:${months}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.asOf < HISTORY_TTL_MS) return cached.closes;

  if (!spendBudget()) return cached?.closes ?? null; // kvot slut ⇒ ev. gammal data

  const from = new Date();
  from.setMonth(from.getMonth() - months);
  const url = `${BASE}/eod/${encodeURIComponent(toSymbol(ticker))}?period=d&from=${from
    .toISOString()
    .slice(0, 10)}&api_token=${key}&fmt=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return cached?.closes ?? null;
    const data: { close?: number }[] = await res.json();
    const closes = data.map((d) => Number(d.close)).filter(Number.isFinite);
    if (closes.length < 2) return cached?.closes ?? null;
    historyCache.set(cacheKey, { closes, asOf: Date.now() });
    return closes;
  } catch {
    return cached?.closes ?? null;
  }
}
