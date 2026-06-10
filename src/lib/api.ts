import { Company, AskResponse, MetricsResponse } from "./types";

const API_BASE = "http://127.0.0.1:8000/api/v1";

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
