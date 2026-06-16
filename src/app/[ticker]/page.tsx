import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import TerrainCanvas from "@/components/TerrainCanvas";
import PriceChart from "@/components/PriceChart";
import { LiveQuotesProvider, LivePrice, LiveDelta } from "@/components/LiveQuotes";
import AskBox from "./AskBox";

/* ⚠️ BEHÅLL — befintliga API-anrop och typer. Designen byter ALDRIG ut detta. */
import { getCompany, getMetrics } from "@/lib/api";
import { Company, MetricsResponse } from "@/lib/types";
import { getQuotes, getPriceHistory, buildChart, fmtSigned, fmtPct, Quote, ChartData } from "@/lib/market";
import { getCompanyNews, type NewsArticle } from "@/lib/news";

const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

/** Datum för nyhetslistan, sv-SE och Stockholmstid. Tom sträng vid ogiltigt. */
function fmtNewsDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(d);
}

/** Fälten designen ritar. Mappa vår datatyp hit i adapt() — inte tvärtom. */
interface CompanyView {
  name: string;
  ticker: string;
  listing: string;
  sector: string;
  price: number;
  deltaAbs: string;
  deltaPct: string;
  up: boolean;
  quarter: string;
  summary: string[]; // stycken; första bokstaven blir dropcap
  sources: { label: string; href?: string }[];
  quote?: { text: string; by: string; role: string; cite: string };
  risks: { h: string; p: string }[];
  opps: { h: string; p: string }[];
  /* Nyckeltal ur rapporten — exakta värden med sidhänvisning. */
  metrics: { label: string; value: string; unit: string | null; page: number }[];
  metricsQuarter: string | null;
  chart?: { linePath: string; areaPath: string; end: { x: number; y: number }; gridLabels: string[] };
}

/* TODO(koppla): enda stället att ändra när backend levererar fler fält
   (sammanfattning från company_summaries, nyckeltal...).
   Sektioner utan data döljs automatiskt i renderingen nedan.
   Pris och graf kommer från EODHD (riktig börsdata, server-side).
   Nyckeltalen extraheras ur rapporten av backend — med sidhänvisning. */
function adapt(
  c: Company,
  market?: { quote?: Quote; chart?: ChartData },
  metricsRes?: MetricsResponse | null,
): CompanyView {
  const q = market?.quote;
  return {
    name: c.name,
    ticker: c.ticker,
    listing: "OMXS",
    sector: c.sector ?? "—",
    price: q?.price ?? 0,
    deltaAbs: q ? fmtSigned(q.change) : "",
    deltaPct: q ? fmtPct(q.changePct) : "",
    up: (q?.changePct ?? 0) >= 0,
    quarter: "", // TODO(koppla): från company_summaries-endpoint
    summary: [], // TODO(koppla): AI-sammanfattningen — visas automatiskt när den finns
    sources: [],
    quote: undefined,
    risks: [],
    opps: [],
    metrics: (metricsRes?.metrics ?? []).map((m) => ({
      label: m.label,
      value: m.value,
      unit: m.unit,
      page: m.page_number,
    })),
    metricsQuarter: metricsRes?.quarter ?? null,
    chart: market?.chart,
  };
}

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  /* AI-funktionaliteten (analys + Q&A) kräver inloggning. */
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect("/login");
  }

  /* params/searchParams är Promises i nya App Router — måste awaitas.
     ?q= kommer från sökfältet och ställs automatiskt i AskBox. */
  const { ticker } = await params;
  const { q: initialQuestion } = await searchParams;

  /* ⚠️ BEHÅLL — datahämtningen sker exakt som innan, inkl. felhantering. */
  let company: Company | null = null;
  let error: string | null = null;
  try {
    company = await getCompany(ticker);
  } catch (e) {
    error = e instanceof Error ? e.message : "Okänt fel";
  }

  if (!company) {
    return (
      <main className="pt-[68px]">
        <div className="mx-auto max-w-wrap px-12 pb-[140px] pt-[120px] max-[1100px]:px-8 max-[640px]:px-5">
          <div className={`${ML} mb-5 text-verm`}>Bolag saknas</div>
          <h1 className="max-w-[680px] font-serif text-[clamp(34px,4.6vw,54px)] font-extrabold leading-[1.06] tracking-[-.014em]">
            {error ?? "Något gick fel."}
          </h1>
          <p className="mt-5 max-w-[480px] text-[15px] text-ivory-2">
            Kontrollera tickern eller gå tillbaka och sök på nytt. Tillgängliga bolag just nu:{" "}
            <span className="font-mono text-[13px] text-ivory">VOLV-B · ERIC-B · EVO</span>
          </p>
          <Link
            href="/dashboard"
            className="mt-9 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.18em] text-verm"
          >
            ← Tillbaka till översikten
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  /* Riktig börsdata (EODHD) + nyckeltal extraherade ur rapporten (backend).
     Misslyckas nyckeltalshämtningen (t.ex. inga rapporter indexerade) döljs panelen. */
  const [quotes, history, metricsRes, news] = await Promise.all([
    getQuotes([company.ticker]),
    getPriceHistory(company.ticker),
    getMetrics(company.ticker).catch(() => null),
    getCompanyNews(company.ticker).catch(() => [] as NewsArticle[]),
  ]);
  const v = adapt(
    company,
    {
      quote: quotes.get(company.ticker),
      chart: history ? buildChart(history) : undefined,
    },
    metricsRes,
  );

  const hasEditorial = v.summary.length > 0 || v.quote || v.risks.length > 0 || v.opps.length > 0;
  const hasAside = v.chart !== undefined || v.metrics.length > 0;

  const [first, ...restOfFirst] = v.summary[0] ?? "";
  const firstRest = restOfFirst.join("");

  return (
    <main className="pt-[68px]">
      {/* ===== Sidhuvud med graverat kurslandskap ===== */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] opacity-45">
          <TerrainCanvas />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] bg-[linear-gradient(180deg,rgba(13,11,8,.35)_0%,rgba(13,11,8,.1)_45%,#0D0B08_96%)]"
        />

        <div className="mx-auto max-w-wrap px-12 pb-[58px] pt-[54px] max-[1100px]:px-8 max-[640px]:px-5">
          <div className={`${ML} mb-[26px] text-mute`}>
            <Link href="/dashboard" className="transition-colors duration-300 hover:text-ivory">
              Översikt
            </Link>
            &nbsp;&nbsp;/&nbsp;&nbsp;{v.sector}&nbsp;&nbsp;/&nbsp;&nbsp;
            <span className="text-ivory-2">{v.name}</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-7 max-[640px]:flex-col max-[640px]:items-start">
            <div>
              <h1 className="font-serif text-[clamp(40px,5.4vw,64px)] font-extrabold leading-none tracking-[-.015em]">
                {v.name}
              </h1>
              <div className={`${ML} mt-3.5 text-mute`}>
                {v.ticker}&nbsp;&nbsp;·&nbsp;&nbsp;{v.listing}&nbsp;&nbsp;·&nbsp;&nbsp;{v.sector}
              </div>
            </div>
            {/* Prisblocket visas först när riktig prisdata finns — inga påhittade
                nollor. Kursen live-uppdateras via /api/quotes. */}
            {quotes.get(v.ticker) && (
              <LiveQuotesProvider tickers={[v.ticker]} initial={Object.fromEntries(quotes)}>
                <div className="text-right max-[640px]:text-left">
                  <div className="font-serif text-[clamp(40px,5.4vw,64px)] font-extrabold leading-none tracking-[-.015em]">
                    <LivePrice ticker={v.ticker} initial={quotes.get(v.ticker)} className="tabular-nums" />
                  </div>
                  <div className={`${ML} mt-[5px] text-mute`}>SEK</div>
                  <div className="mt-[9px] font-mono text-[12.5px]">
                    <LiveDelta ticker={v.ticker} initial={quotes.get(v.ticker)} />
                    &nbsp;&nbsp;<span className="text-mute">IDAG</span>
                  </div>
                </div>
              </LiveQuotesProvider>
            )}
          </div>
        </div>
      </section>

      {/* ===== AI-samtalet (huvudnumret) + rapportdata sida vid sida ===== */}
      <div className="mx-auto max-w-wrap px-12 pb-[110px] max-[1100px]:px-8 max-[640px]:px-5">
        <div
          className={`grid gap-12 max-[1100px]:grid-cols-1 ${
            hasAside ? "grid-cols-[1.6fr_1fr]" : "mx-auto max-w-[880px] grid-cols-1"
          }`}
        >
          {/* Vänster: själva AI:t + redaktionellt material under */}
          <div className="min-w-0">
            {/* ⚠️ BEHÅLL — AskBox med askCompany-logiken. */}
            <AskBox ticker={v.ticker} companyName={v.name} initialQuestion={initialQuestion} />

            {hasEditorial && (
              <article className="mt-12 border-t border-hair pt-12">
              {v.summary.length > 0 && (
                <>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,79,46,.4)] bg-[rgba(255,79,46,.06)] px-[15px] py-[7px] font-mono text-[10px] uppercase tracking-[.2em] text-verm">
                    <span className="inline-block animate-spinSlow motion-reduce:animate-none">✦</span> AI-analys
                  </div>
                  <h2 className="mb-5 font-serif text-[27px] font-bold">
                    Sammanfattning
                    {v.quarter && (
                      <>
                        <span className="mx-2 text-[20px] font-normal text-mute">·</span>
                        {v.quarter}
                      </>
                    )}
                  </h2>

                  <div className="max-w-[620px] text-[15px] text-ivory-2">
                    <span className="float-left pr-3.5 pt-2 font-serif text-[74px] font-extrabold leading-[.78] text-verm">
                      {first}
                    </span>
                    <p>{firstRest}</p>
                    {v.summary.slice(1).map((p, i) => (
                      <p key={i} className="mt-4">{p}</p>
                    ))}
                  </div>

                  {v.sources.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center gap-3.5">
                      {v.sources.map((s, i) => (
                        <span key={s.label} className="inline-flex items-center gap-3.5">
                          {i > 0 && <span className={`${ML} text-mute`}>·</span>}
                          <a
                            href={s.href ?? "#"}
                            className="inline-flex items-center gap-2 border-b border-[rgba(255,79,46,.35)] pb-[3px] font-mono text-[10.5px] uppercase tracking-[.14em] text-verm transition-colors duration-300 hover:border-verm"
                          >
                            {s.label} ↗
                          </a>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {v.quote && (
                <div className="mt-10 flex gap-[22px] border-t border-hair pt-[34px]">
                  <span className="mt-2.5 shrink-0 font-serif text-[64px] leading-[.6] text-verm">”</span>
                  <div>
                    <div className={`${ML} mb-3 text-mute`}>Vad VD:n sa</div>
                    <p className="font-serif text-[20.5px] font-medium italic leading-[1.5]">{v.quote.text}</p>
                    <div className={`${ML} mt-3.5 text-mute`}>
                      — {v.quote.by}&nbsp;&nbsp;·&nbsp;&nbsp;{v.quote.role}&nbsp;&nbsp;·&nbsp;&nbsp;
                      <span className="text-verm">{v.quote.cite} ↗</span>
                    </div>
                  </div>
                </div>
              )}

              {(v.risks.length > 0 || v.opps.length > 0) && (
                <div className="mt-11 grid grid-cols-2 gap-11 border-t border-hair pt-[38px] max-[640px]:grid-cols-1">
                  <div>
                    <h3 className="mb-1 font-serif text-[25px] font-extrabold text-verm">Risker</h3>
                    <div className={`${ML} mb-[22px] text-mute`}>{v.risks.length} kritiska faktorer</div>
                    {v.risks.map((r, i) => (
                      <div key={r.h} className={`group flex gap-4 py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}>
                        <span className="font-mono text-[19px] font-bold leading-[1.3] text-mute transition-colors group-hover:text-ivory">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="mb-[3px] font-serif text-[16.5px] font-bold">{r.h}</div>
                          <p className="text-[12.8px] leading-[1.55] text-mute">{r.p}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-1 font-serif text-[25px] font-extrabold text-sage">Möjligheter</h3>
                    <div className={`${ML} mb-[22px] text-mute`}>{v.opps.length} tillväxtvektorer</div>
                    {v.opps.map((o, i) => (
                      <div key={o.h} className={`group flex gap-4 py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}>
                        <span className="font-mono text-[19px] font-bold leading-[1.3] text-mute transition-colors group-hover:text-ivory">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="mb-[3px] font-serif text-[16.5px] font-bold">{o.h}</div>
                          <p className="text-[12.8px] leading-[1.55] text-mute">{o.p}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </article>
            )}
          </div>

          {/* Höger: marknadsdata extraherad ur rapporten (klistrad vid scroll) */}
          {hasAside && (
            <aside className="flex flex-col gap-7 self-start min-[1101px]:sticky min-[1101px]:top-[88px]">
              {v.chart && (
                <div className="rounded-[14px] border border-hair bg-[rgba(242,234,219,.018)] p-[22px]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`${ML} text-mute`}>Pris · 6 mån</span>
                    <div className="flex gap-2.5">
                      {["1D", "1V", "1M", "6M", "1Å", "5Å"].map((r) => (
                        <span
                          key={r}
                          className={`cursor-pointer font-mono text-[10px] transition-colors duration-300 hover:text-ivory ${r === "6M" ? "text-verm" : "text-mute"}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <PriceChart
                    ariaLabel={`${v.name}, prisutveckling 6 månader`}
                    linePath={v.chart.linePath}
                    areaPath={v.chart.areaPath}
                    end={v.chart.end}
                    gridLabels={v.chart.gridLabels}
                  />
                </div>
              )}

              {v.metrics.length > 0 && (
                <div className="rounded-[14px] border border-hair bg-[rgba(242,234,219,.018)] p-[22px]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`${ML} text-mute`}>
                      Nyckeltal{v.metricsQuarter ? ` · ${v.metricsQuarter}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[.16em] text-verm">
                      <span className="inline-block animate-spinSlow motion-reduce:animate-none">✦</span> Ur rapporten
                    </span>
                  </div>
                  {v.metrics.map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex items-baseline justify-between gap-4 py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}
                    >
                      <span className="text-[13.5px] text-ivory-2">{row.label}</span>
                      <span className="shrink-0 text-right">
                        <span className="font-mono text-[15.5px] font-bold text-ivory">
                          {row.value}
                          {/* Dubblera inte enheten om värdet redan slutar med den (t.ex. "57,0%"). */}
                          {row.unit && !row.value.endsWith(row.unit) ? (
                            <span className="ml-1.5 text-[10.5px] font-normal text-mute">{row.unit}</span>
                          ) : null}
                        </span>
                        <span className="mt-[3px] block font-mono text-[9.5px] font-normal uppercase tracking-[.1em] text-verm">
                          s. {row.page}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      {/* ===== I nyheterna — färska artiklar om bolaget (EODHD, cachat 24 h) ===== */}
      {news.length > 0 && (
        <section className="mx-auto max-w-wrap px-12 pb-[120px] max-[1100px]:px-8 max-[640px]:px-5">
          <div className="mb-7 flex items-baseline justify-between border-t border-hair pt-12">
            <h2 className="font-serif text-[27px] font-bold">I nyheterna</h2>
            <span className={`${ML} text-mute`}>Senaste om {v.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-9 max-[760px]:grid-cols-1">
            {news.map((a) => (
              <a
                key={a.link}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-[16px] border border-hair bg-[rgba(242,234,219,.018)] p-8 transition-[border-color,transform,box-shadow] duration-300 ease-silk hover:-translate-y-0.5 hover:border-hair-2 hover:shadow-[0_20px_50px_rgba(0,0,0,.35)] max-[640px]:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className={`${ML} truncate text-mute`}>
                    {[fmtNewsDate(a.date), a.source].filter(Boolean).join("\u2002·\u2002")}
                  </span>
                  <span className="shrink-0 text-sm text-verm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    ↗
                  </span>
                </div>
                <h3 className="font-serif text-[18px] font-bold leading-snug transition-colors duration-300 group-hover:text-verm">
                  {a.title}
                </h3>
                {a.snippet && (
                  <p className="mt-3.5 line-clamp-3 text-[13px] leading-[1.65] text-mute">{a.snippet}…</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
