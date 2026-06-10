import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Reveal, CountUp } from "@/components/Reveal";
import { TiltShowcase, MagneticButton } from "@/components/Tilt";
import PriceChart from "@/components/PriceChart";
import ThesisCard from "@/components/ThesisCard";
import QADemo from "@/components/QADemo";
import { TickItem } from "@/components/Ticker";
import { getQuotes, getPriceHistory, buildChart, fmtPrice, fmtSigned, fmtPct } from "@/lib/market";

/* Nordiska symboler i tickertejpen — riktiga kurser via EODHD. */
const TAPE = ["OMXS30", "VOLV-B", "ERIC-B", "INVE-B", "ATCO-A", "SEB-A", "HM-B", "EVO", "SAND", "ABB"];

const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`mb-[22px] flex items-center gap-3 ${center ? "justify-center" : ""}`}>
      <span className={`${ML} text-verm`}>{children}</span>
      <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-verm motion-reduce:animate-none" />
    </div>
  );
}

const RISKS = [
  { h: "Tull-exponering mot USA", p: "Om nya tullar på fordonsimport genomförs drabbas Volvo direkt." },
  { h: "Bygg-konjunktur i Europa", p: "Volvo CE är överexponerat mot infrastrukturinvesteringar." },
  { h: "Kinesisk konkurrens", p: "Inhemska tillverkare som BYD och Sany pressar priser i Asien." },
];
const OPPS = [
  { h: "Elektrifiering tunga lastbilar", p: "Segmentet växer 40% YoY. Volvo leder marknadsandelen i Europa." },
  { h: "Indien-marknadens återhämtning", p: "Återhämtning väntad från Q2 2026 enligt bolagets egen guidning." },
  { h: "Aftermarket-tjänster", p: "Service och reservdelar växer stabilt med 22% rörelsemarginal." },
];

export default async function Home() {
  const raw = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const mastDate = raw.charAt(0).toUpperCase() + raw.slice(1);

  /* Riktig börsdata (EODHD, cachad server-side). Misslyckas hämtningen
     faller tejpen tillbaka på demoinnehåll och deltan behåller demovärden. */
  const [quotes, volvoHistory] = await Promise.all([
    getQuotes(TAPE),
    getPriceHistory("VOLV-B"),
  ]);

  const ticks: TickItem[] = TAPE.filter((t) => quotes.has(t)).map((t) => {
    const q = quotes.get(t)!;
    return [t, fmtPrice(q.price), fmtPct(q.changePct), q.changePct >= 0];
  });

  const deltas = Object.fromEntries(
    ["VOLV-B", "ERIC-B", "EVO", "ATCO-A"]
      .filter((t) => quotes.has(t))
      .map((t) => {
        const q = quotes.get(t)!;
        return [t, { delta: fmtPct(q.changePct), up: q.changePct >= 0 }];
      }),
  );

  const volvo = quotes.get("VOLV-B");
  const volvoChart = volvoHistory ? buildChart(volvoHistory) : undefined;

  return (
    <main>
      <Hero mastDate={mastDate} ticks={ticks.length > 0 ? ticks : undefined} deltas={deltas} />

      {/* ============ SHOWCASE: BOLAGSSIDAN ============ */}
      <section id="bolag" className="relative py-[150px] max-[640px]:py-[100px]">
        <div className="mx-auto max-w-wrap px-12 max-[1100px]:px-8 max-[640px]:px-5">
          <Reveal className="mb-16 max-w-[680px]">
            <Eyebrow>Produkten — Bolagssidan</Eyebrow>
            <h2 className="font-serif text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.06] tracking-[-.014em]">
              Rapporten släpps 07:00.
              <br />
              <span className="italic font-medium">Din analys är klar</span> <span className="text-verm">07:15.</span>
            </h2>
            <p className="mt-5 max-w-[540px] text-base text-ivory-2">
              Varje kvartalsrapport indexeras automatiskt inom minuter. Sammanfattning, risker, möjligheter och
              nyckeltal — alltid med källan ett klick bort.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <TiltShowcase>
              <div className="overflow-hidden rounded-[22px] border border-hair-2 bg-[linear-gradient(165deg,#1B1711_0%,#14110C_55%,#110E09_100%)] shadow-[0_60px_140px_rgba(0,0,0,.55),0_0_0_1px_rgba(0,0,0,.4),inset_0_1px_0_rgba(242,234,219,.06)]">
                <div className="flex items-center gap-2 border-b border-hair bg-[rgba(13,11,8,.35)] px-[22px] py-[15px]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2C261D]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2C261D]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2C261D]" />
                  <span className="ml-3.5 rounded-[7px] border border-hair bg-[rgba(242,234,219,.03)] px-3.5 py-[5px] font-mono text-[11px] tracking-[.08em] text-mute">
                    <b className="font-medium text-ivory-2">thesis.se</b>/bolag/volvo
                  </span>
                </div>

                <div className="grid grid-cols-[1.5fr_1fr] max-[1100px]:grid-cols-1">
                  {/* Vänsterspalt */}
                  <div className="border-r border-hair px-12 pb-10 pt-11 max-[1100px]:border-b max-[1100px]:border-r-0 max-[640px]:px-6 max-[640px]:py-8">
                    <div className={`${ML} mb-[26px] text-mute`}>
                      Bolag&nbsp;&nbsp;/&nbsp;&nbsp;Industri&nbsp;&nbsp;/&nbsp;&nbsp;<span className="text-ivory-2">Volvo AB</span>
                    </div>

                    <div className="mb-9 flex flex-wrap items-end justify-between gap-7 max-[640px]:flex-col max-[640px]:items-start">
                      <div>
                        <div className="font-serif text-[54px] font-extrabold leading-none tracking-[-.015em]">Volvo AB</div>
                        <div className={`${ML} mt-3 text-mute`}>VOLV-B&nbsp;&nbsp;·&nbsp;&nbsp;OMXS30&nbsp;&nbsp;·&nbsp;&nbsp;Industri</div>
                      </div>
                      {/* Riktig kurs när EODHD svarar; annars demovärden. */}
                      <div className="text-right max-[640px]:text-left">
                        <div className="font-serif text-[54px] font-extrabold leading-none tracking-[-.015em]">
                          <CountUp value={volvo?.price ?? 466.8} decimals={2} />
                        </div>
                        <div className={`${ML} mt-[5px] text-mute`}>SEK</div>
                        <div className={`mt-[9px] font-mono text-[12.5px] ${(volvo?.changePct ?? 1) >= 0 ? "text-sage" : "text-verm"}`}>
                          {volvo ? fmtSigned(volvo.change) : "+10,50"}&nbsp;&nbsp;{volvo ? fmtPct(volvo.changePct) : "+2,31%"}&nbsp;&nbsp;<span className="text-mute">IDAG</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,79,46,.4)] bg-[rgba(255,79,46,.06)] px-[15px] py-[7px] font-mono text-[10px] uppercase tracking-[.2em] text-verm">
                      <span className="inline-block animate-spinSlow motion-reduce:animate-none">✦</span> AI-analys
                    </div>
                    <h3 className="mb-5 font-serif text-[27px] font-bold">
                      Sammanfattning<span className="mx-2 text-[20px] font-normal text-mute">·</span>Q3 2025
                    </h3>
                    <div className="relative max-w-[560px] text-[15px] text-ivory-2">
                      <span className="float-left pr-3.5 pt-2 font-serif text-[74px] font-extrabold leading-[.78] text-verm">V</span>
                      <p>
                        olvo redovisade ett lägre rörelseresultat än marknadens konsensus, främst pga fortsatt svag
                        efterfrågan i Nordamerika där lastbilsorderingången sjönk 18% år-över-år. Europa visar däremot
                        tecken på stabilisering enligt VD:s kommentarer, och elektrifieringen växer tvåsiffrigt över
                        alla segment.
                      </p>
                      <p className="mt-4">Marginalen i Volvo CE Asien minskade från 11,2% till 7,8%, vilket är den största enskilda förklaringen till resultatmissen.</p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3.5">
                      <a href="#" className="inline-flex items-center gap-2 border-b border-[rgba(255,79,46,.35)] pb-[3px] font-mono text-[10.5px] uppercase tracking-[.14em] text-verm transition-colors duration-300 hover:border-verm">
                        Källa ↗&nbsp; Volvo Q3 2025
                      </a>
                      <span className={`${ML} text-mute`}>·</span>
                      <a href="#" className="inline-flex items-center gap-2 border-b border-hair-2 pb-[3px] font-mono text-[10.5px] uppercase tracking-[.14em] text-mute">
                        Paragraf 3
                      </a>
                    </div>

                    <div className="mt-10 flex gap-[22px] border-t border-hair pt-[34px]">
                      <span className="mt-2.5 shrink-0 font-serif text-[64px] leading-[.6] text-verm">”</span>
                      <div>
                        <div className={`${ML} mb-3 text-mute`}>Vad VD:n sa</div>
                        <p className="font-serif text-[20.5px] font-medium italic leading-[1.5]">
                          We see signs of stabilisation in Europe, but North America remains a concern. Our focus on
                          electrification continues to outpace the market.
                        </p>
                        <div className={`${ML} mt-3.5 text-mute`}>
                          — Martin Lundstedt&nbsp;&nbsp;·&nbsp;&nbsp;VD&nbsp;&nbsp;·&nbsp;&nbsp;<span className="text-verm">Transcript 14:32 ↗</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-11 grid grid-cols-2 gap-11 border-t border-hair pt-[38px] max-[640px]:grid-cols-1">
                      <div>
                        <h4 className="mb-1 font-serif text-[25px] font-extrabold text-verm">Risker</h4>
                        <div className={`${ML} mb-[22px] text-mute`}>3 kritiska faktorer</div>
                        {RISKS.map((r, i) => (
                          <div key={r.h} className={`group flex gap-4 py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}>
                            <span className="font-mono text-[19px] font-bold leading-[1.3] text-mute transition-colors group-hover:text-ivory">{String(i + 1).padStart(2, "0")}</span>
                            <div>
                              <div className="mb-[3px] font-serif text-[16.5px] font-bold">{r.h}</div>
                              <p className="text-[12.8px] leading-[1.55] text-mute">{r.p}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="mb-1 font-serif text-[25px] font-extrabold text-sage">Möjligheter</h4>
                        <div className={`${ML} mb-[22px] text-mute`}>3 tillväxtvektorer</div>
                        {OPPS.map((o, i) => (
                          <div key={o.h} className={`group flex gap-4 py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}>
                            <span className="font-mono text-[19px] font-bold leading-[1.3] text-mute transition-colors group-hover:text-ivory">{String(i + 1).padStart(2, "0")}</span>
                            <div>
                              <div className="mb-[3px] font-serif text-[16.5px] font-bold">{o.h}</div>
                              <p className="text-[12.8px] leading-[1.55] text-mute">{o.p}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Högerspalt */}
                  <div className="flex flex-col gap-7 bg-[rgba(13,11,8,.22)] px-[34px] py-[38px] max-[640px]:px-[22px] max-[640px]:py-7">
                    <div className="rounded-[14px] border border-hair bg-[rgba(242,234,219,.018)] p-[22px]">
                      <div className="mb-4 flex items-center justify-between">
                        <span className={`${ML} text-mute`}>Pris · 6 mån</span>
                        <div className="flex gap-2.5">
                          {["1D", "1V", "1M", "6M", "1Å", "5Å"].map((r) => (
                            <span key={r} className={`cursor-pointer font-mono text-[10px] transition-colors duration-300 hover:text-ivory ${r === "6M" ? "text-verm" : "text-mute"}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <PriceChart
                        ariaLabel="Volvo B, prisutveckling 6 månader"
                        linePath={volvoChart?.linePath}
                        areaPath={volvoChart?.areaPath}
                        end={volvoChart?.end}
                        gridLabels={volvoChart?.gridLabels}
                      />
                    </div>

                    <div className="rounded-[14px] border border-hair bg-[rgba(242,234,219,.018)] p-[22px]">
                      <div className="mb-4 flex items-center justify-between">
                        <span className={`${ML} text-mute`}>Värdering</span>
                      </div>
                      {[
                        { k: "P/E (TTM)", v: 12.4, suffix: "", ctx: "5Å snitt 14,8" },
                        { k: "P/S", v: 0.8, suffix: "", ctx: "Peers 1,1" },
                        { k: "Direktavkastning", v: 3.6, suffix: "%", ctx: "Sektor 2,9%" },
                        { k: "Skuldsättning (ND/EBITDA)", v: 1.2, suffix: "x", ctx: "Mål < 2,0x" },
                        { k: "Rörelsemarginal", v: 11.8, suffix: "%", ctx: "Q3 22 → 9,4%", up: true },
                      ].map((row, i) => (
                        <div key={row.k} className={`flex items-baseline justify-between py-[13px] ${i > 0 ? "border-t border-hair" : ""}`}>
                          <span className="text-[13.5px] text-ivory-2">{row.k}</span>
                          <span className="text-right font-mono text-[15.5px] font-bold">
                            <CountUp value={row.v} decimals={1} />
                            {row.suffix}
                            <span className={`mt-[3px] block font-mono text-[9.5px] font-normal uppercase tracking-[.1em] ${row.up ? "text-sage" : "text-mute"}`}>
                              {row.ctx}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[14px] border border-[rgba(255,79,46,.4)] bg-[linear-gradient(180deg,rgba(255,79,46,.05),rgba(255,79,46,.015))] p-[22px]">
                      <div className="mb-[11px] flex items-center gap-[9px] font-mono text-[10.5px] uppercase tracking-[.18em] text-verm">✦ Fråga om Volvo</div>
                      <p className="mb-4 text-[12.5px] leading-[1.55] text-ivory-2">
                        Källhänvisade svar baserade på senaste rapporten, transcripts och pressreleaser.
                      </p>
                      <div className="flex items-center gap-2.5 rounded-[9px] border border-hair-2 bg-[rgba(13,11,8,.55)] px-3.5 py-[11px]">
                        <span className="flex-1 font-serif text-sm italic text-mute">Varför sjönk marginalen i Sydostasien?</span>
                        <b className="text-[15px] text-verm">→</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltShowcase>
          </Reveal>
        </div>
      </section>

      {/* ============ TESER ============ */}
      <section id="teser" className="bg-[linear-gradient(180deg,#0D0B08_0%,#100D08_50%,#0D0B08_100%)] py-[150px] max-[640px]:py-[100px]">
        <div className="mx-auto max-w-wrap px-12 max-[1100px]:px-8 max-[640px]:px-5">
          <Reveal className="mb-16 max-w-[680px]">
            <Eyebrow>Tes-trackern</Eyebrow>
            <h2 className="font-serif text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.06] tracking-[-.014em]">
              Din externa hjärna
              <br />
              <span className="italic font-medium">för</span> <span className="text-verm">200 aktiva teser.</span>
            </h2>
            <p className="mt-5 max-w-[540px] text-base text-ivory-2">
              Skriv varför du äger ett bolag — Thesis bevakar varje kvartal mot dina trösklar och säger till exakt när
              en tes bryts. Disciplin, automatiserad.
            </p>
          </Reveal>

          <div className="grid grid-cols-3 gap-[26px] max-[1100px]:mx-auto max-[1100px]:max-w-[560px] max-[1100px]:grid-cols-1">
            <Reveal delay={0}>
              <ThesisCard
                status="broken"
                question="”Organisk tillväxt ska överstiga 5%”"
                company="Vitec Software · VIT-B"
                thresholdLabel="TRÖSKEL 5%"
                thresholdY={32}
                points="10,18 48,26 86,40 124,22 162,44 200,38 238,48 270,52"
                endX={270}
                endY={52}
                note={<>Q3 levererade <b>3,2%</b> — fjärde kvartalet av de senaste sex under din tröskel. <b>Förvärvsmotorn kan dölja underliggande svaghet.</b></>}
              />
            </Reveal>
            <Reveal delay={120}>
              <ThesisCard
                status="strong"
                question="”EBITA-marginalen ska nå 24% under 2026”"
                company="Vitec Software · VIT-B"
                thresholdLabel="TRÖSKEL 24%"
                thresholdY={20}
                points="10,52 48,48 86,50 124,42 162,38 200,34 238,28 270,23"
                endX={270}
                endY={23}
                note={<>Q3 levererade <b>23,8%</b>, +18% EBITA YoY drivet av Tietoevry- och Aloc-integrationerna. <b>På god väg.</b></>}
              />
            </Reveal>
            <Reveal delay={240}>
              <ThesisCard
                status="watch"
                question="”Förvärv ska bidra med 15+ MSEK ARR per år”"
                company="Vitec Software · VIT-B"
                thresholdLabel="MÅL 15 MSEK"
                thresholdY={26}
                points="10,58 48,54 86,55 124,48 162,50 200,44 238,40 270,42"
                endX={270}
                endY={42}
                note={<>Bouvet-systemet bidrar med <b>+4 MSEK ARR</b> i sitt första kvartal. Thesis bevakar takten mot årsmålet.</>}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FRÅGA & SVAR ============ */}
      <section id="fraga" className="py-[150px] max-[640px]:py-[100px]">
        <div className="mx-auto max-w-wrap px-12 max-[1100px]:px-8 max-[640px]:px-5">
          <Reveal className="mx-auto mb-16 max-w-[720px] text-center">
            <Eyebrow center>Fråga &amp; svar</Eyebrow>
            <h2 className="font-serif text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.06] tracking-[-.014em]">
              Ställ frågan du <span className="italic font-medium">faktiskt</span> har.
            </h2>
            <p className="mx-auto mt-5 max-w-[540px] text-base text-ivory-2">
              Fritext mot åtta kvartal av rapporter, transcripts och konsensusdata. Svaret kommer på sekunder — med
              källan bredvid varje siffra.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <QADemo />
          </Reveal>
        </div>
      </section>

      {/* ============ PRIS ============ */}
      <section id="pris" className="pb-[150px] pt-[90px] max-[640px]:pb-[100px]">
        <div className="mx-auto max-w-wrap px-12 max-[1100px]:px-8 max-[640px]:px-5">
          <Reveal className="mx-auto mb-16 max-w-[680px] text-center">
            <Eyebrow center>Pris</Eyebrow>
            <h2 className="font-serif text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.06] tracking-[-.014em]">
              Mindre än <span className="italic font-medium">en lunch</span> i veckan.
            </h2>
          </Reveal>

          <div className="mx-auto grid max-w-[920px] grid-cols-2 gap-7 max-[1100px]:max-w-[560px] max-[1100px]:grid-cols-1">
            <Reveal delay={0}>
              <div className="rounded-[22px] border border-hair bg-[linear-gradient(180deg,rgba(26,22,16,.5),rgba(19,16,11,.25))] px-10 py-[42px] transition-[transform,box-shadow,border-color] duration-[450ms] ease-silk hover:-translate-y-1.5 hover:shadow-[0_40px_90px_rgba(0,0,0,.45)]">
                <div className="mb-1.5 font-serif text-[30px] font-extrabold">Pro</div>
                <p className="mb-[30px] min-h-[42px] text-[13.5px] text-mute">
                  För dig som äger 5–15 bolag och vill förstå dem på riktigt — inte bara följa kursen.
                </p>
                <div className="mb-[34px] flex items-baseline gap-2.5">
                  <b className="font-serif text-[52px] font-extrabold tracking-[-.02em]">149 kr</b>
                  <span className={`${ML} text-mute`}>/ mån</span>
                </div>
                <ul>
                  {["AI-sammanfattning inom 15 min från release", "Frågor i fritext — alltid med källhänvisning", "Tes-tracker med mejlnotis när en tes bryts", "Peer-jämförelser och historik"].map((f) => (
                    <li key={f} className="flex items-start gap-[13px] border-t border-hair py-3 text-sm text-ivory-2 before:shrink-0 before:font-mono before:text-verm before:content-['→']">
                      {f}
                    </li>
                  ))}
                </ul>
                {/* TODO(koppla): signup-route när den finns */}
                <button type="button" className="mt-[34px] block w-full rounded-full border border-hair-2 p-4 text-center font-mono text-[11px] uppercase tracking-[.16em] transition-[border-color,background] duration-300 hover:border-ivory-2 hover:bg-[rgba(242,234,219,.05)]">
                  Börja gratis — 3 bolag
                </button>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="relative rounded-[22px] border border-[rgba(201,160,99,.45)] bg-[linear-gradient(180deg,rgba(36,29,18,.6),rgba(22,18,12,.35))] px-10 py-[42px] transition-[transform,box-shadow,border-color] duration-[450ms] ease-silk hover:-translate-y-1.5 hover:border-[rgba(201,160,99,.7)] hover:shadow-[0_40px_90px_rgba(0,0,0,.45)]">
                <span className="absolute -top-[13px] left-10 rounded-full bg-brass px-4 py-[7px] font-mono text-[9.5px] font-bold uppercase tracking-[.22em] text-ink">
                  För professionella
                </span>
                <div className="mb-1.5 font-serif text-[30px] font-extrabold">Premium</div>
                <p className="mb-[30px] min-h-[42px] text-[13.5px] text-mute">
                  För förvaltare under rapportsäsong: 30 bolag rapporterar på två veckor — prioritera rätt på minuter.
                </p>
                <div className="mb-[34px] flex items-baseline gap-2.5">
                  <b className="font-serif text-[52px] font-extrabold tracking-[-.02em] text-brass">1 500 kr</b>
                  <span className={`${ML} text-mute`}>/ mån</span>
                </div>
                <ul>
                  {["Obegränsade teser över hela portföljen", "Konsensus-revideringar & reaktionshistorik", "Transcript-indexering i realtid", "Prioriterad pipeline — analys < 5 min", "API-åtkomst (beta)"].map((f) => (
                    <li key={f} className="flex items-start gap-[13px] border-t border-hair py-3 text-sm text-ivory-2 before:shrink-0 before:font-mono before:text-brass before:content-['→']">
                      {f}
                    </li>
                  ))}
                </ul>
                {/* TODO(koppla): boka-demo-route när den finns */}
                <MagneticButton className="mt-[34px] block w-full rounded-full bg-verm p-4 text-center font-mono text-[11px] font-bold uppercase tracking-[.14em] text-ink transition-[background,box-shadow] duration-[350ms] ease-silk hover:bg-[#FF6044] hover:shadow-[0_10px_38px_rgba(255,79,46,.35)]">
                  Boka demo
                </MagneticButton>
              </div>
            </Reveal>
          </div>

          <p className={`${ML} mt-9 text-center text-mute`}>
            Inget betalkort krävs&nbsp;&nbsp;·&nbsp;&nbsp;Avsluta när du vill&nbsp;&nbsp;·&nbsp;&nbsp;Moms ingår
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
