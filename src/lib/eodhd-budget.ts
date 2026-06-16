/* Delad dagsbudget för ALLA EODHD-anrop (kurser, historik, nyheter).
   Gratisplanen tillåter ~20 anrop/dygn — vi håller oss under med marginal.

   OBS: räknaren ligger i serverns minne. Den nollas vid omstart och delas inte
   mellan serverless-instanser. För en enskild server / låg trafik räcker det;
   vid skalning bör räknaren flyttas till t.ex. Supabase. Den marknads-/TTL-
   styrda cachningen är ändå den primära broms som håller anropen nere. */

const envInt = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const DAILY_BUDGET = envInt(process.env.EODHD_DAILY_BUDGET, 19);

let state = { day: "", used: 0 };

function stockholmDay(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Reserverar ett anrop ur dagsbudgeten. Returnerar false när kvoten är slut. */
export function spendBudget(): boolean {
  const day = stockholmDay();
  if (state.day !== day) state = { day, used: 0 };
  if (state.used >= DAILY_BUDGET) return false;
  state.used += 1;
  return true;
}

/** Antal anrop kvar idag (för ev. diagnostik/loggning). */
export function budgetRemaining(): number {
  if (state.day !== stockholmDay()) return DAILY_BUDGET;
  return Math.max(0, DAILY_BUDGET - state.used);
}
