import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/api";
import { Company } from "@/lib/types";
import { getQuotes } from "@/lib/market";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import { LiveQuotesProvider, LivePrice, LivePct } from "@/components/LiveQuotes";

const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

/* TODO(koppla): ersätt med användarens bevakningslista / list-endpoint
   (GET /api/v1/companies) när den finns i backend. */
const AVAILABLE_TICKERS = ["VOLV-B", "ERIC-B", "EVO"];

const EXAMPLE_QUESTIONS = [
  "Vad var det viktigaste i senaste rapporten?",
  "Vilka risker lyfter ledningen fram?",
  "Hur utvecklades marginalen jämfört med förra kvartalet?",
];

function greeting(): string {
  const hour = Number(
    new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", hour12: false }),
  );
  if (hour < 5) return "God natt";
  if (hour < 10) return "God morgon";
  if (hour < 18) return "God dag";
  return "God kväll";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  /* Riktig bolagsdata från backend + riktiga kurser från EODHD. */
  const [results, quotes] = await Promise.all([
    Promise.allSettled(AVAILABLE_TICKERS.map((t) => getCompany(t))),
    getQuotes(AVAILABLE_TICKERS),
  ]);
  const companies: Company[] = results
    .filter((r): r is PromiseFulfilledResult<Company> => r.status === "fulfilled")
    .map((r) => r.value);

  const raw = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mastDate = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <main className="pt-[68px]">
      <div className="mx-auto max-w-wrap px-12 pb-[110px] pt-[54px] max-[1100px]:px-8 max-[640px]:px-5">
        {/* ===== Sidhuvud ===== */}
        <div className="mb-[22px] flex items-center gap-3">
          <span className={`${ML} text-verm`}>Översikt</span>
          <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-verm motion-reduce:animate-none" />
        </div>

        <div className="mb-12 flex flex-wrap items-end justify-between gap-7">
          <div>
            <h1 className="font-serif text-[clamp(40px,5.4vw,64px)] font-extrabold leading-[1.02] tracking-[-.015em]">
              {greeting()}<span className="text-verm">.</span>
            </h1>
            <div className={`${ML} mt-4 text-mute`}>
              {mastDate}&nbsp;&nbsp;·&nbsp;&nbsp;Inloggad som{" "}
              <span className="text-ivory-2 normal-case tracking-[.08em]">{data.user.email}</span>
            </div>
          </div>
        </div>

        {/* ===== Sök / ställ en fråga ===== */}
        <section aria-label="Sök bolag" className="mb-[70px]">
          <HeroSearch />
        </section>

        {/* ===== Bolag ===== */}
        <LiveQuotesProvider tickers={AVAILABLE_TICKERS} initial={Object.fromEntries(quotes)}>
        <section aria-label="Tillgängliga bolag">
          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="font-serif text-[27px] font-bold">Dina bolag</h2>
            <span className={`${ML} text-mute`}>
              {companies.length} {companies.length === 1 ? "bolag" : "bolag"} indexerade
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="rounded-[18px] border border-hair bg-[linear-gradient(180deg,rgba(26,22,16,.55),rgba(19,16,11,.3))] px-9 py-12">
              <div className={`${ML} mb-3 text-verm`}>Ingen kontakt med analysmotorn</div>
              <p className="max-w-[480px] text-[14.5px] leading-[1.65] text-ivory-2">
                Kunde inte hämta bolagen. Kontrollera att backend körs
                (<span className="font-mono text-[13px]">uvicorn main:app --reload</span> i thesis-api)
                och ladda om sidan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[26px] max-[1100px]:grid-cols-1 max-[1100px]:mx-auto max-[1100px]:w-full max-[1100px]:max-w-[560px]">
              {companies.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/${c.ticker}`}
                  className="group relative overflow-hidden rounded-[18px] border border-hair bg-[linear-gradient(180deg,rgba(26,22,16,.55),rgba(19,16,11,.3))] px-7 pb-6 pt-7 backdrop-blur-[10px] transition-[transform,border-color,box-shadow] duration-[450ms] ease-silk hover:-translate-y-[7px] hover:border-hair-2 hover:shadow-[0_30px_70px_rgba(0,0,0,.45)]"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-verm to-transparent opacity-0 transition-opacity duration-[450ms] group-hover:opacity-70" />
                  <div className={`${ML} mb-3.5 flex items-center justify-between text-mute`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span>{c.sector ?? "—"}</span>
                  </div>
                  <h3 className="font-serif text-[26px] font-bold leading-[1.15] transition-colors duration-300 group-hover:text-verm">
                    {c.name}
                  </h3>
                  <div className={`${ML} mt-2 text-mute`}>{c.ticker}</div>
                  {/* Riktig kurs (EODHD) — live via /api/quotes, döljs utan data. */}
                  {quotes.has(c.ticker) && (
                    <div className="mt-3.5 flex items-baseline gap-2.5 font-mono">
                      <LivePrice
                        ticker={c.ticker}
                        initial={quotes.get(c.ticker)}
                        className="text-[16px] font-bold text-ivory"
                      />
                      <span className="text-[10px] uppercase tracking-[.1em] text-mute">SEK</span>
                      <LivePct
                        ticker={c.ticker}
                        initial={quotes.get(c.ticker)}
                        className="text-[12px] font-medium"
                      />
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-between border-t border-hair pt-4">
                    <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-verm">
                      Öppna analys
                    </span>
                    <span className="text-sm text-verm transition-transform duration-300 ease-silk group-hover:translate-x-[5px]">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        </LiveQuotesProvider>

        {/* ===== Kom igång-tips ===== */}
        <section aria-label="Exempel på frågor" className="mt-[70px]">
          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="font-serif text-[27px] font-bold">Ställ frågan du faktiskt har</h2>
            <span className={`${ML} text-mute max-[640px]:hidden`}>Alltid med källhänvisning</span>
          </div>
          <div className="rounded-[18px] border border-[rgba(255,79,46,.3)] bg-[linear-gradient(180deg,rgba(255,79,46,.04),rgba(255,79,46,.012))] px-9 py-8">
            <p className="mb-6 max-w-[560px] text-[14.5px] leading-[1.65] text-ivory-2">
              Öppna ett bolag och ställ en fråga i fritext — svaret bygger enbart på bolagets
              faktiska rapporter, med sidhänvisning efter varje påstående.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {EXAMPLE_QUESTIONS.map((q) => (
                <span
                  key={q}
                  className="rounded-full border border-hair px-[17px] py-2 font-serif text-[13.5px] italic text-ivory-2"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
