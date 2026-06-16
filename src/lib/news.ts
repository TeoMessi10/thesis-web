/**
 * Bolagsnyheter via EODHD /api/news — körs ENBART på servern (nyckeln stannar
 * kvar serverside). Importera aldrig som värde i en "use client"-komponent.
 *
 * BUDGET: varje nyhetsförfrågan kostar ~5 EODHD-anrop. Därför:
 *  - Hård cache 24 h per bolag (nyheter under en kvartalsrapport behöver inte
 *    vara sekundfärska).
 *  - Hämtas lat — bara när en bolagssida faktiskt renderas.
 *  - Delar dagsbudget med kurser/historik (eodhd-budget.ts) ⇒ vi överskrider
 *    aldrig gratisplanens ~20 anrop/dygn; vid slut serveras cachad/tom data.
 */

import { spendBudget } from "./eodhd-budget";

const BASE = "https://eodhd.com/api";

export interface NewsArticle {
  date: string; // ISO 8601 från EODHD
  title: string;
  link: string;
  source: string; // härlett ur länkens domän
  snippet: string; // kort utdrag ur artikeltexten
}

const envInt = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const NEWS_TTL_MS = envInt(process.env.EODHD_NEWS_TTL_MS, 24 * 60 * 60_000);
const NEWS_LIMIT = envInt(process.env.EODHD_NEWS_LIMIT, 6);
const MIN_RETRY_MS = envInt(process.env.EODHD_NEWS_MIN_RETRY_MS, 5 * 60_000);

interface EodNews {
  date?: string;
  title?: string;
  link?: string;
  content?: string;
}

const cache = new Map<string, { articles: NewsArticle[]; asOf: number }>();
const lastAttempt = new Map<string, number>();

/** Bolagen i databasen är Stockholmsnoterade. */
function toSymbol(ticker: string): string {
  return `${ticker}.ST`;
}

function hostOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Senaste nyheterna för ett bolag. Cachas 24 h och delar dagsbudgeten. */
export async function getCompanyNews(ticker: string, limit = NEWS_LIMIT): Promise<NewsArticle[]> {
  const key = process.env.EODHD_API_KEY;
  if (!key) return [];

  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.asOf < NEWS_TTL_MS) return cached.articles.slice(0, limit);

  /* Strypning av nya försök efter fel, och stopp när dagsbudgeten är slut —
     i båda fallen serveras ev. äldre cache hellre än att bränna anrop. */
  const recentlyTried = Date.now() - (lastAttempt.get(ticker) ?? 0) < MIN_RETRY_MS;
  if (recentlyTried) return cached?.articles ?? [];
  if (!spendBudget()) return cached?.articles ?? [];

  lastAttempt.set(ticker, Date.now());
  const url = `${BASE}/news?s=${encodeURIComponent(toSymbol(ticker))}&limit=${limit}&api_token=${key}&fmt=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return cached?.articles ?? [];
    const data: EodNews[] = await res.json();
    if (!Array.isArray(data)) return cached?.articles ?? [];

    const seen = new Set<string>();
    const articles: NewsArticle[] = [];
    for (const a of data) {
      if (!a.title || !a.link) continue;
      const title = clean(a.title);
      /* Dedupe på normaliserad rubrik — EODHD återger ofta samma story
         (t.ex. både gemener och VERSALER) från olika nyhetstrådar. */
      const dedupeKey = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      articles.push({
        date: a.date ?? "",
        title,
        link: a.link,
        source: hostOf(a.link),
        snippet: a.content ? clean(a.content).slice(0, 180) : "",
      });
    }

    cache.set(ticker, { articles, asOf: Date.now() });
    return articles.slice(0, limit);
  } catch {
    return cached?.articles ?? [];
  }
}
