/* Lokalt bolagsregister för sök-/frågetolkning på frontend.
   TODO(koppla): ersätt med en riktig lookup-/sök-endpoint i thesis-api
   (t.ex. GET /api/v1/companies eller /search) när den finns. Tills dess
   matchar vi mot de bolag som faktiskt är indexerade. */

export interface KnownCompany {
  ticker: string;
  /* Namn/alias i gemener som vi letar efter i fritext (bolagsnamn, smeknamn). */
  aliases: string[];
}

export const KNOWN_COMPANIES: KnownCompany[] = [
  { ticker: "VOLV-B", aliases: ["volvo", "volv"] },
  { ticker: "ERIC-B", aliases: ["ericsson", "eric"] },
  { ticker: "EVO", aliases: ["evolution", "evo"] },
];

const TICKERS = KNOWN_COMPANIES.map((c) => c.ticker);

/** Normaliserar en ticker som användaren skrivit (versaler, trimmat). */
function normalizeTicker(text: string): string {
  return text.trim().toUpperCase();
}

/** Är hela inmatningen exakt en känd ticker (t.ex. "evo" eller "VOLV-B")? */
export function matchExactTicker(text: string): string | null {
  const t = normalizeTicker(text);
  return TICKERS.find((ticker) => ticker === t) ?? null;
}

export interface ResolvedQuery {
  ticker: string | null;
  /* Frågetexten med ev. ledande "TICKER," / bolagsnamn kvar — visas/skickas som den är. */
  question: string;
}

/** Tolkar fritext från sökfältet och försöker hitta vilket bolag den gäller.

   Exempel:
   - "EVO"                                   → { ticker: "EVO", question: "" }
   - "EVO, vilka risker finns?"              → { ticker: "EVO", question: "vilka risker finns?" }
   - "Vilka risker finns i att köpa Volvo?"  → { ticker: "VOLV-B", question: "<hela frågan>" }
   - "Vad händer på börsen?"                 → { ticker: null,     question: "<hela frågan>" } */
export function resolveQuery(raw: string): ResolvedQuery {
  const trimmed = raw.trim();
  if (!trimmed) return { ticker: null, question: "" };

  /* Ren ticker/bolagsnamn utan fråga → bara öppna bolaget. */
  const exact = matchExactTicker(trimmed);
  if (exact) return { ticker: exact, question: "" };

  /* Ledande "TICKER, …" eller "TICKER: …" → resten är frågan. */
  const prefixMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9-]*)\s*[,:]\s*(.+)$/s);
  if (prefixMatch) {
    const prefixTicker = matchExactTicker(prefixMatch[1]) ?? aliasToTicker(prefixMatch[1]);
    if (prefixTicker) {
      return { ticker: prefixTicker, question: prefixMatch[2].trim() };
    }
  }

  /* Annars: leta efter ett bolagsnamn/ticker var som helst i frågan. */
  return { ticker: findTickerInText(trimmed), question: trimmed };
}

/** Slår upp ticker från ett enskilt alias-ord (t.ex. "volvo" → "VOLV-B"). */
function aliasToTicker(word: string): string | null {
  const w = word.trim().toLowerCase();
  return KNOWN_COMPANIES.find((c) => c.aliases.includes(w))?.ticker ?? null;
}

/** Letar efter en känd ticker eller bolagsalias som helt ord i texten. */
function findTickerInText(text: string): string | null {
  const lower = text.toLowerCase();
  const words = new Set(lower.split(/[^a-z0-9-]+/).filter(Boolean));
  for (const c of KNOWN_COMPANIES) {
    if (words.has(c.ticker.toLowerCase())) return c.ticker;
    if (c.aliases.some((a) => words.has(a))) return c.ticker;
  }
  return null;
}
