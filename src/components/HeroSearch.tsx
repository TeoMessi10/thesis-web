"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useMotion";
import { resolveQuery } from "@/lib/companies";

const DEFAULT_PLACEHOLDER = "Sök bolag, ticker eller ställ en fråga…";
const QUERIES = [
  "Varför sjönk Volvos marginal i Sydostasien?",
  "Förklara Macau-risken i Evolution som om jag är ny.",
  "Hur reviderar analytiker EPS efter en Vitec-miss?",
  "Jämför Atlas Copcos orderingång mot Sandvik.",
];
/* Tickers som faktiskt finns i databasen just nu. */
const CHIPS = ["VOLV-B", "ERIC-B", "EVO"];

export default function HeroSearch() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);

  /* ⌘K / Ctrl+K fokuserar fältet */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Roterande typewriter-placeholder — ren state, ingen DOM-manipulation */
  useEffect(() => {
    if (reduced) return;
    let qi = 0;
    let ci = 0;
    let del = false;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;

    const tw = () => {
      if (!alive) return;
      if (!pausedRef.current) {
        const q = QUERIES[qi];
        if (!del) {
          ci++;
          setPlaceholder(q.slice(0, ci));
          if (ci === q.length) {
            del = true;
            timer = setTimeout(tw, 2400);
            return;
          }
        } else {
          ci--;
          setPlaceholder(q.slice(0, ci) || DEFAULT_PLACEHOLDER);
          if (ci === 0) {
            del = false;
            qi = (qi + 1) % QUERIES.length;
            timer = setTimeout(tw, 450);
            return;
          }
        }
      }
      timer = setTimeout(tw, del ? 16 : 38 + Math.random() * 30);
    };
    timer = setTimeout(tw, 1900);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reduced]);

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    /* Skilj på "öppna bolag" och "ställ en fråga". Tickern hör hemma i
       URL:ens path-segment; fritextfrågan skickas som ?q= och ställs
       automatiskt av AskBox via POST /companies/{ticker}/ask. */
    const { ticker, question } = resolveQuery(trimmed);

    if (!ticker) {
      setError(
        "Vi kunde inte avgöra vilket bolag du menar. Börja med en ticker, t.ex. \u201eEVO, vilka risker finns?\u201d",
      );
      return;
    }

    setError(null);
    const href = question
      ? `/${ticker}?q=${encodeURIComponent(question)}`
      : `/${ticker}`;
    router.push(href);
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex max-w-[620px] items-center gap-3.5 rounded-[14px] border border-hair-2 bg-[linear-gradient(180deg,rgba(28,23,16,.74),rgba(19,16,11,.6))] py-1.5 pl-[22px] pr-2 backdrop-blur-[16px] transition-[border-color,box-shadow] duration-[350ms] focus-within:border-[rgba(255,79,46,.55)] focus-within:shadow-[0_0_0_4px_rgba(255,79,46,.08),0_18px_50px_rgba(0,0,0,.4)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2EADB" strokeWidth="2" aria-hidden="true" className="shrink-0 opacity-55">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onFocus={() => {
            pausedRef.current = true;
          }}
          onBlur={() => {
            if (!value) pausedRef.current = false;
          }}
          placeholder={placeholder}
          aria-label="Sök bolag eller ställ en fråga"
          className="min-w-0 flex-1 bg-transparent py-3.5 font-sans text-[15.5px] text-ivory outline-none placeholder:text-mute"
        />
        <span className="shrink-0 rounded-[7px] border border-hair-2 bg-[rgba(242,234,219,.04)] px-[9px] py-[5px] font-mono text-[11px] text-mute max-[640px]:hidden">
          ⌘ K
        </span>
        <button
          type="submit"
          aria-label="Sök"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-verm text-[17px] text-ink transition-[background,box-shadow] duration-300 hover:bg-[#FF6044] hover:shadow-[0_6px_24px_rgba(255,79,46,.4)]"
        >
          →
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-3 max-w-[620px] rounded-[10px] border border-[rgba(255,79,46,.35)] bg-[rgba(255,79,46,.05)] px-4 py-2.5 text-[13px] leading-[1.5] text-verm"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="mr-1 font-mono text-[11px] font-medium uppercase tracking-[.2em] text-mute">Prova</span>
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setValue(c);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-hair px-[17px] py-2 font-mono text-[11.5px] tracking-[.04em] text-ivory-2 transition-[border-color,color,background,transform] duration-300 ease-silk hover:-translate-y-0.5 hover:border-verm hover:bg-[rgba(255,79,46,.07)] hover:text-ivory"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
