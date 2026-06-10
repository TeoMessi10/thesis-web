/**
 * Börsdata via EODHD — körs ENBART på servern (server components).
 * Nyckeln (EODHD_API_KEY i .env.local) saknar NEXT_PUBLIC_-prefix och får
 * aldrig nå webbläsaren. Importera ALDRIG den här modulen i en
 * "use client"-komponent — skicka färdig data som props istället.
 *
 * Misslyckade anrop ger tom map/null så att UI:t döljer prisblock
 * istället för att visa felaktiga siffror.
 */

const BASE = "https://eodhd.com/api";

export interface Quote {
  ticker: string; // vår ticker (t.ex. VOLV-B)
  price: number;
  change: number;
  changePct: number;
}

export interface ChartData {
  linePath: string;
  areaPath: string;
  end: { x: number; y: number };
  gridLabels: string[];
}

const sv = new Intl.NumberFormat("sv-SE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtPrice = (v: number) => sv.format(v);
/** Signerat tal med riktigt minustecken (−), sv-SE-format. */
export const fmtSigned = (v: number) => `${v >= 0 ? "+" : "−"}${sv.format(Math.abs(v))}`;
export const fmtPct = (v: number) => `${fmtSigned(v)}%`;

/** Vår ticker → EODHD-symbol. Bolagen i databasen är Stockholmsnoterade. */
function toSymbol(ticker: string): string {
  if (ticker === "OMXS30") return "OMXS30.INDX";
  return `${ticker}.ST`;
}

function fromSymbol(code: string): string {
  return code.replace(/\.(ST|INDX)$/, "");
}

interface EodRealtime {
  code?: string;
  close?: number | string;
  change?: number | string;
  change_p?: number | string;
}

/** Hämtar realtidskurser (15 min fördröjda) för en lista tickers.
   Cache 5 min — EODHD:s free-plan har låg dagskvot, och kurserna är
   ändå fördröjda, så tätare uppdatering ger inget. */
export async function getQuotes(tickers: string[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const key = process.env.EODHD_API_KEY;
  if (!key || tickers.length === 0) return out;

  const [first, ...rest] = tickers.map(toSymbol);
  const params = new URLSearchParams({ api_token: key, fmt: "json" });
  if (rest.length > 0) params.set("s", rest.join(","));
  const url = `${BASE}/real-time/${encodeURIComponent(first)}?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return out;
    const data: EodRealtime | EodRealtime[] = await res.json();
    const list = Array.isArray(data) ? data : [data];
    for (const q of list) {
      const price = Number(q.close);
      // EODHD svarar "NA" för okända symboler — hoppa över dem.
      if (!q.code || !Number.isFinite(price)) continue;
      const change = Number(q.change);
      const pct = Number(q.change_p);
      const ticker = fromSymbol(q.code);
      out.set(ticker, {
        ticker,
        price,
        change: Number.isFinite(change) ? change : 0,
        changePct: Number.isFinite(pct) ? pct : 0,
      });
    }
  } catch {
    // Nätverksfel ⇒ tom map; anroparen döljer prisvisningen.
  }
  return out;
}

/** Dagliga stängningskurser för de senaste `months` månaderna. Cache 1 h. */
export async function getPriceHistory(ticker: string, months = 6): Promise<number[] | null> {
  const key = process.env.EODHD_API_KEY;
  if (!key) return null;

  const from = new Date();
  from.setMonth(from.getMonth() - months);
  const url = `${BASE}/eod/${encodeURIComponent(toSymbol(ticker))}?period=d&from=${from
    .toISOString()
    .slice(0, 10)}&api_token=${key}&fmt=json`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data: { close?: number }[] = await res.json();
    const closes = data.map((d) => Number(d.close)).filter(Number.isFinite);
    return closes.length >= 2 ? closes : null;
  } catch {
    return null;
  }
}

/** Bygger SVG-vägar för PriceChart (viewBox 520×230; kurvan ritas 0–466 × 50–200). */
export function buildChart(closes: number[]): ChartData {
  const X1 = 466;
  const TOP = 50;
  const BOT = 200;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  const pts = closes.map((p, i) => {
    const x = Math.round((i / (closes.length - 1)) * X1 * 10) / 10;
    const y = Math.round((BOT - ((p - min) / span) * (BOT - TOP)) * 10) / 10;
    return [x, y] as const;
  });

  const linePath = `M${pts.map(([x, y]) => `${x},${y}`).join(" L")}`;
  const areaPath = `${linePath} L${X1},230 L0,230 Z`;
  const [ex, ey] = pts[pts.length - 1];

  /* Prisnivåer vid gridlinjerna y=40/100/160 (extrapolerat ovanför kurvtoppen). */
  const priceAt = (y: number) => max - ((y - TOP) / (BOT - TOP)) * span;
  const gridLabels = [40, 100, 160].map((y) => String(Math.round(priceAt(y))));

  return { linePath, areaPath, end: { x: ex, y: ey }, gridLabels };
}
