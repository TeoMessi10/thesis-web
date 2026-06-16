"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useMotion";

/* ⚠️ BEHÅLL — befintligt API-anrop. askCompany returnerar AskResponse
   ({ answer, sources: { page_number, similarity }[] }) enligt lib/types.ts. */
import { askCompany } from "@/lib/api";

const ML = "font-mono text-[11px] font-medium uppercase tracking-[.2em]";

const SUGGESTIONS = [
  "Vad var det viktigaste i senaste rapporten?",
  "Vilka risker lyfter ledningen fram?",
  "Hur utvecklades marginalen jämfört med förra kvartalet?",
  "Vad sa VD:n om framtiden?",
];

interface Exchange {
  q: string;
  answer: string;
  pages: number[];
}

/** Ord-för-ord-reveal av ett RIKTIGT svar (samma rörelse som demon på landningssidan). */
function AnswerText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const [count, setCount] = useState(reduced ? words.length : 0);

  useEffect(() => {
    if (reduced) {
      setCount(words.length);
      return;
    }
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCount(i);
      if (i >= words.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [words, reduced]);

  return (
    <p className="text-[15.5px] leading-[1.75] text-ivory-2">
      {words.map((w, i) => (
        <span key={i}>
          <span
            className={`transition-opacity duration-[220ms] ${i < count ? "opacity-100" : "opacity-0"} ${
              /\d/.test(w) ? "font-mono text-[14px] font-semibold text-ivory" : ""
            }`}
          >
            {w}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}

/** Vermilion-diamanten — Thesis "avatar" i svaren. */
function Diamond({ size = 34 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-verm shadow-[0_0_24px_rgba(255,79,46,.35)]"
      style={{ width: size, height: size }}
    >
      <span className="block rotate-45 bg-ink" style={{ width: size * 0.32, height: size * 0.32 }} />
    </div>
  );
}

export default function AskBox({
  ticker,
  companyName,
  initialQuestion,
}: {
  ticker: string;
  companyName: string;
  initialQuestion?: string;
}) {
  /* ⚠️ BEHÅLL — samma state-mönster och anrop som innan, nu med historik. */
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState<string | null>(null); // frågan som väntar på svar
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const askedInitial = useRef(false);

  const loading = pending !== null;

  useEffect(() => {
    if (exchanges.length === 0 && !loading) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [exchanges, loading]);

  /* Frågan från sökfältet (?q=) ställs automatiskt en gång vid laddning. */
  useEffect(() => {
    if (askedInitial.current) return;
    const q = initialQuestion?.trim();
    if (!q) return;
    askedInitial.current = true;
    submit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function submit(raw: string) {
    const q = raw.trim();
    if (!q || loading) return;
    setQuestion("");
    setError(null);
    setPending(q);
    try {
      /* ⚠️ BEHÅLL — exakt samma anrop som innan. */
      const res = await askCompany(ticker, q);
      const pages = [...new Set(res.sources.map((s) => s.page_number))].sort((a, b) => a - b);
      setExchanges((prev) => [...prev, { q, answer: res.answer, pages }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel — försök igen.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-hair-2 bg-[linear-gradient(170deg,#1A1610,#110E09)] shadow-[0_50px_120px_rgba(0,0,0,.5),inset_0_1px_0_rgba(242,234,219,.05)]">
      {/* Terminalhuvud */}
      <div className="flex items-center justify-between border-b border-hair px-10 py-[20px] max-[640px]:px-5">
        <span className={`${ML} text-ivory-2`}>
          thesis.se&nbsp;/&nbsp;{ticker.toLowerCase()}&nbsp;/&nbsp;fråga
        </span>
        <span className={`${ML} flex items-center gap-2 text-mute max-[640px]:hidden`}>
          <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-verm motion-reduce:animate-none" />
          Indexerad · Senaste rapport
        </span>
      </div>

      {/* Konversationsyta */}
      <div className="min-h-[300px] px-10 py-9 max-[640px]:px-5 max-[640px]:py-6">
        {exchanges.length === 0 && !loading && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-verm shadow-[0_0_40px_rgba(255,79,46,.4)]">
              <span className="block h-[17px] w-[17px] rotate-45 bg-ink" />
            </div>
            <h2 className="mb-3 font-serif text-[clamp(24px,3vw,32px)] font-bold leading-[1.2]">
              Fråga Thesis om {companyName}
            </h2>
            <p className="mx-auto mb-8 max-w-[440px] text-[14.5px] leading-[1.65] text-ivory-2">
              Svaret bygger enbart på bolagets faktiska rapporter — varje påstående
              med <span className="font-medium text-ivory">sidhänvisning</span>. Inga gissningar.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border border-hair px-[17px] py-2 font-serif text-[13.5px] italic text-ivory-2 transition-[border-color,color,background,transform] duration-300 ease-silk hover:-translate-y-0.5 hover:border-verm hover:bg-[rgba(255,79,46,.07)] hover:text-ivory"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {exchanges.map((ex, i) => (
          <div key={i} className={i > 0 ? "mt-10 border-t border-hair pt-10" : ""}>
            {/* Frågebubblan */}
            <div className="ml-auto w-fit max-w-[78%] rounded-[16px_16px_4px_16px] border border-hair-2 bg-[rgba(242,234,219,.06)] px-[22px] py-4 text-[15px] leading-[1.6] max-[640px]:max-w-[95%]">
              {ex.q}
            </div>
            {/* Svaret */}
            <div className="mt-[26px] flex gap-[18px]">
              <Diamond />
              <div className="min-w-0 flex-1">
                <AnswerText text={ex.answer} />
                {ex.pages.length > 0 && (
                  <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
                    <span className={`${ML} text-mute`}>Källor</span>
                    {ex.pages.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-[rgba(255,79,46,.35)] bg-[rgba(255,79,46,.05)] px-3.5 py-[7px] font-mono text-[10px] uppercase tracking-[.14em] text-verm"
                      >
                        s. {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className={exchanges.length > 0 ? "mt-10 border-t border-hair pt-10" : ""}>
            <div className="ml-auto w-fit max-w-[78%] rounded-[16px_16px_4px_16px] border border-hair-2 bg-[rgba(242,234,219,.06)] px-[22px] py-4 text-[15px] leading-[1.6] max-[640px]:max-w-[95%]">
              {pending}
            </div>
            <div className="mt-[26px] flex items-center gap-[18px]">
              <Diamond />
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <i
                    key={i}
                    className="h-1.5 w-1.5 animate-think rounded-full bg-mute not-italic"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-8 rounded-[12px] border border-[rgba(255,79,46,.35)] bg-[rgba(255,79,46,.05)] px-5 py-4 text-[13.5px] text-verm">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Inmatning */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex items-center gap-3.5 border-t border-hair bg-[rgba(13,11,8,.45)] py-3 pl-10 pr-3 transition-[box-shadow] duration-300 focus-within:shadow-[inset_0_2px_0_rgba(255,79,46,.4)] max-[640px]:pl-5"
      >
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ställ en fråga om ${companyName}…`}
          aria-label={`Ställ en fråga om ${companyName}`}
          className="min-w-0 flex-1 bg-transparent py-3 font-serif text-[16px] italic text-ivory outline-none placeholder:text-mute"
        />
        <button
          type="submit"
          aria-label="Skicka fråga"
          disabled={loading || !question.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-verm text-[17px] text-ink transition-[background,box-shadow,opacity] duration-300 hover:bg-[#FF6044] hover:shadow-[0_6px_24px_rgba(255,79,46,.4)] disabled:opacity-35 disabled:hover:bg-verm disabled:hover:shadow-none"
        >
          →
        </button>
      </form>
    </div>
  );
}
