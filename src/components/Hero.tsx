"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TerrainCanvas from "@/components/TerrainCanvas";
import HeroCta from "@/components/HeroCta";
import LiveTicker from "@/components/LiveTicker";
import type { QuotesRecord } from "@/hooks/useLiveQuotes";
import { useReducedMotion } from "@/hooks/useMotion";

const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

/* TODO(koppla): byt mot riktig rapportfeed från api.ts när den finns.
   Demo-innehåll — länkarna pekar på ticker-routes (`/${tick}`).
   Kursdeltan ersätts med riktig data via `deltas`-prop. */
const REPORTS = [
  { idx: "01", name: "Volvo AB", tick: "VOLV-B", delta: "−3,4%", up: false, sum: "Lägre rörelseresultat än väntat. Svag efterfrågan i Nordamerika.", meta: "Q3 2025 · för 2 timmar sedan" },
  { idx: "02", name: "Ericsson", tick: "ERIC-B", delta: "+1,8%", up: true, sum: "Marginalexpansion i Networks. Asien fortsatt utmaning.", meta: "Q3 2025 · i går, 07:30" },
  { idx: "03", name: "Evolution", tick: "EVO", delta: "−1,40%", up: false, sum: "Stark tillväxt i Live Casino. Regulatorisk osäkerhet i Asien kvarstår.", meta: "Q3 2025 · för 2 dagar sedan" },
  { idx: "04", name: "Atlas Copco", tick: "ATCO-A", delta: "+4,2%", up: true, sum: "Återhämtning i Compressor Technique. Service-omsättning på rekordnivå.", meta: "Q3 2025 · för 3 dagar sedan" },
];

const HEADLINE: { text: string; cls: string }[] = [
  { text: "Förstå", cls: "" },
  { text: "vilket bolag som helst", cls: "italic font-medium tracking-[-.008em]" },
  { text: "på 30 sekunder.", cls: "text-verm [text-shadow:0_0_60px_rgba(255,79,46,.28)]" },
];

export default function Hero({
  mastDate,
  tapeOrder,
  initialQuotes,
  deltas,
}: {
  mastDate: string;
  tapeOrder: string[];
  initialQuotes: QuotesRecord;
  deltas?: Record<string, { delta: string; up: boolean }>;
}) {
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const reports = REPORTS.map((r) => (deltas?.[r.tick] ? { ...r, ...deltas[r.tick] } : r));

  /* Entré-koreografin: en frame efter mount så transitions hinner få startläge */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const on = loaded || reduced;

  return (
    <header className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <TerrainCanvas />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_18%_30%,rgba(13,11,8,.42)_0%,transparent_55%),linear-gradient(180deg,rgba(13,11,8,.55)_0%,rgba(13,11,8,0)_24%,rgba(13,11,8,0)_62%,#0D0B08_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[340px] -left-[260px] h-[780px] w-[780px] animate-drift1 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(255,79,46,.17),rgba(199,58,31,.06)_55%,transparent_72%)] mix-blend-screen blur-[110px] motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[200px] -top-[260px] h-[620px] w-[620px] animate-drift2 rounded-full bg-[radial-gradient(circle_at_60%_50%,rgba(201,160,99,.10),transparent_68%)] mix-blend-screen blur-[110px] motion-reduce:animate-none"
      />

      <div className="flex flex-1 items-center pb-24 pt-[108px] max-[1100px]:pt-[130px]">
        <div className="mx-auto grid w-full max-w-wrap grid-cols-[1.22fr_.82fr] items-center gap-[76px] px-12 max-[1100px]:grid-cols-1 max-[1100px]:gap-[54px] max-[1100px]:px-8 max-[640px]:px-5">
          <div>
            <div className="mb-[42px] flex items-center gap-3.5 max-[640px]:flex-wrap max-[640px]:gap-2">
              <span className={`${ML} text-ivory-2`}>Vol. I</span>
              <span className={`${ML} text-mute`}>·</span>
              <span className={`${ML} text-ivory-2`}>Utgåva #017</span>
              <span className={`${ML} text-mute`}>·</span>
              <span className={`${ML} text-ivory-2`}>{mastDate}</span>
            </div>

            <h1 className="mb-[34px] font-serif text-[clamp(58px,8.6vw,124px)] font-extrabold leading-[.98] tracking-[-.018em] max-[640px]:mb-[26px]">
              {HEADLINE.map((l, i) => (
                <span key={i} className="block overflow-hidden pb-[.07em] -mb-[.07em]">
                  <span
                    className={`block transition-transform duration-[1050ms] ease-silk motion-reduce:transition-none ${
                      on ? "translate-y-0" : "translate-y-[112%]"
                    } ${l.cls}`}
                    style={reduced ? undefined : { transitionDelay: `${i * 100}ms` }}
                  >
                    {l.text}
                  </span>
                </span>
              ))}
            </h1>

            <p
              className={`mb-10 max-w-[480px] text-[16.5px] text-ivory-2 transition-[opacity,transform] duration-[900ms] ease-silk motion-reduce:transition-none ${
                on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={reduced ? undefined : { transitionDelay: "420ms" }}
            >
              AI-driven research för nordiska investerare. Varje påstående är{" "}
              <span className="font-medium text-ivory">källhänvisat</span> till exakt paragraf i rapporten — inga
              gissningar, inga hallucinationer.
            </p>

            <div
              className={`transition-[opacity,transform] duration-[900ms] ease-silk motion-reduce:transition-none ${
                on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={reduced ? undefined : { transitionDelay: "560ms" }}
            >
              <HeroCta />
            </div>
          </div>

          <aside
            aria-label="Senaste rapporter"
            className="rounded-[18px] border border-hair bg-[linear-gradient(180deg,rgba(26,22,16,.6),rgba(19,16,11,.42))] px-[30px] pb-3.5 pt-[30px] shadow-[0_30px_80px_rgba(0,0,0,.45)] backdrop-blur-[14px] max-[1100px]:max-w-[640px]"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className={`${ML} text-verm`}>Senaste rapporter</span>
                <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-verm motion-reduce:animate-none" />
              </span>
            </div>

            {reports.map((r, i) => (
              <Link
                key={r.idx}
                href={`/${r.tick}`}
                className={`group relative block py-[18px] pt-5 transition-[opacity,transform] duration-[800ms] ease-silk motion-reduce:transition-none ${
                  i > 0 ? "border-t border-hair" : ""
                } ${on ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"}`}
                style={reduced ? undefined : { transitionDelay: `${550 + i * 120}ms` }}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[.1em] text-mute">{r.idx}</span>
                  <span className="font-serif text-[21px] font-bold transition-colors duration-300 group-hover:text-verm">
                    {r.name}
                  </span>
                  <span className="font-mono text-[10px] tracking-[.12em] text-mute">{r.tick}</span>
                  <span className={`ml-auto font-mono text-[13px] font-medium ${r.up ? "text-sage" : "text-verm"}`}>
                    {r.delta}
                  </span>
                </div>
                <p className="mt-[7px] max-w-[92%] text-[13.5px] leading-[1.55] text-ivory-2">{r.sum}</p>
                <div className={`${ML} mt-2.5 text-mute`}>{r.meta}</div>
                <span className="absolute bottom-[18px] right-0 translate-x-[-6px] translate-y-1.5 text-sm text-verm opacity-0 transition-[opacity,transform] duration-300 ease-silk group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
                  ↗
                </span>
              </Link>
            ))}

            <Link
              href="/rapporter"
              className="group inline-flex items-center gap-2.5 pb-2 pt-[18px] font-mono text-[11px] uppercase tracking-[.18em] text-verm"
            >
              Visa alla rapporter{" "}
              <span className="transition-transform duration-300 ease-silk group-hover:translate-x-[5px]">→</span>
            </Link>
          </aside>
        </div>
      </div>

      <LiveTicker order={tapeOrder} initial={initialQuotes} />
    </header>
  );
}
