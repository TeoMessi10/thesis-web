import { Company, AskResponse, MetricsResponse } from "./types";

/* Backend-origin. Sätts via NEXT_PUBLIC_API_BASE_URL i produktion (Railway-URL,
   t.ex. https://thesis-api.up.railway.app) och faller tillbaka på lokal backend
   under utveckling. Måste vara NEXT_PUBLIC_ eftersom askCompany anropas från
   klienten. API:t versioneras i sökvägen (/api/v1) — den läggs på här. */
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000";
const API_BASE = `${API_ORIGIN}/api/v1`;

/** Hämtar ett bolag baserat på ticker. Kastar fel om bolaget inte finns. */
export async function getCompany(ticker: string): Promise<Company> {
  const res = await fetch(`${API_BASE}/companies/${ticker}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Bolaget "${ticker}" hittades inte`);
    }
    throw new Error(`Fel vid hämtning (${res.status})`);
  }
  return res.json();
}

/** Nyckeltal extraherade ur senaste rapporten, med sidhänvisning.
   Anropas server-side; cachas 1 h (extraktionen kostar ett Claude-anrop). */
export async function getMetrics(ticker: string): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/companies/${ticker}/metrics`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Fel vid hämtning av nyckeltal (${res.status})`);
  }
  return res.json();
}

/** Ställer en fråga om ett bolag och får ett källtroget svar. */
export async function askCompany(
  ticker: string,
  question: string
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/companies/${ticker}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new Error(`Fel vid fråga (${res.status})`);
  }
  return res.json();
}
