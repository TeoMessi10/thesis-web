"use client";

import { useEffect, useMemo, useState } from "react";
import { useInView, useReducedMotion } from "@/hooks/useMotion";

const Q_STR =
  "Vad är min downside om jag säljer halva Vitec-positionen idag — hur har konsensus reviderats efter tidigare rapporter?";
/* |...| markerar tal som ska highlightas i mono/ivory */
const A_STR =
  "Efter en miss av Q3:s storlek har analytikerkåren i snitt reviderat ner EPS-prognosen med |4,8%| inom 48 timmar — baserat på Vitecs åtta senaste rapporttillfällen. Historiskt har det motsvarat en ytterligare kursnedgång på |3–6%| när neddragningarna publiceras. Halverar du positionen före öppning låser du in dagens |−4%| men undviker den sannolika revideringssvansen.";
const CITES = ["Q3-rapport ¶ 2–4", "Transcript 14:32", "Konsensus · 8 kvartal"];

type Phase = "idle" | "typing" | "thinking" | "answering" | "done";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function QADemo() {
  const [stageRef, inView] = useInView<HTMLDivElement>({ threshold: 0.35, rootMargin: "0px" });
  const reduced = useReducedMotion();

  const words = useMemo(
    () =>
      A_STR.split(" ").map((w) => ({
        text: w.split("|").join(""),
        num: w.includes("|"),
      })),
    [],
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [qLen, setQLen] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [citeCount, setCiteCount] = useState(0);
  const [run, setRun] = useState(0); // ökas av "Spela upp igen"

  useEffect(() => {
    if (!inView) return;

    if (reduced) {
      setPhase("done");
      setQLen(Q_STR.length);
      setWordCount(words.length);
      setCiteCount(CITES.length);
      return;
    }

    let alive = true;
    (async () => {
      setPhase("typing");
      setQLen(0);
      setWordCount(0);
      setCiteCount(0);
      await sleep(400);
      for (let i = 0; i < Q_STR.length; i++) {
        if (!alive) return;
        setQLen(i + 1);
        await sleep(Q_STR[i] === " " ? 24 : 20 + Math.random() * 26);
      }
      await sleep(380);
      if (!alive) return;
      setPhase("thinking");
      await sleep(1350);
      if (!alive) return;
      setPhase("answering");
      for (let i = 0; i < words.length; i++) {
        if (!alive) return;
        setWordCount(i + 1);
        await sleep(16);
      }
      await sleep(220);
      for (let i = 0; i < CITES.length; i++) {
        if (!alive) return;
        setCiteCount(i + 1);
        await sleep(150);
      }
      if (alive) setPhase("done");
    })();

    return () => {
      alive = false;
    };
  }, [inView, reduced, run, words]);

  const answerVisible = phase === "answering" || phase === "done";

  return (
    <div
      ref={stageRef}
      className="mx-auto min-h-[420px] max-w-[780px] rounded-[22px] border border-hair-2 bg-[linear-gradient(170deg,#1A1610,#110E09)] px-11 pb-11 pt-10 shadow-[0_50px_120px_rgba(0,0,0,.5),inset_0_1px_0_rgba(242,234,219,.05)] max-[640px]:px-[22px] max-[640px]:pb-8 max-[640px]:pt-7"
    >
      <div className="mb-[34px] flex items-center justify-between border-b border-hair pb-[22px]">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[.2em] text-ivory-2">
          thesis.se&nbsp;/&nbsp;vitec&nbsp;/&nbsp;fråga
        </span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[.2em] text-mute max-[640px]:hidden">
          Indexerad: Q3-rapport · Transcript · Konsensus 8 kv
        </span>
      </div>

      {/* Frågebubblan */}
      <div className="ml-auto min-h-[54px] w-fit max-w-[78%] rounded-[16px_16px_4px_16px] border border-hair-2 bg-[rgba(242,234,219,.06)] px-[22px] py-4 text-[15px] leading-[1.6] max-[640px]:max-w-[95%]">
        <span>{Q_STR.slice(0, qLen)}</span>
        {phase === "typing" && (
          <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 animate-blink bg-verm align-middle" />
        )}
      </div>

      {/* Svaret */}
      <div
        className={`mt-[30px] flex gap-[18px] transition-opacity duration-500 ${
          phase === "thinking" || answerVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          aria-hidden="true"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-verm shadow-[0_0_24px_rgba(255,79,46,.35)] before:h-[11px] before:w-[11px] before:rotate-45 before:bg-ink before:content-['']"
        />
        <div className="min-w-0 flex-1">
          {phase === "thinking" && (
            <div className="flex h-[34px] items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <i
                  key={i}
                  className="h-1.5 w-1.5 animate-think rounded-full bg-mute not-italic"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {answerVisible && (
            <p className="text-[15.5px] leading-[1.75] text-ivory-2">
              {words.map((w, i) => (
                <span key={i}>
                  <span
                    className={`transition-opacity duration-[220ms] ${i < wordCount ? "opacity-100" : "opacity-0"} ${
                      w.num ? "font-mono text-[14px] font-semibold text-ivory" : ""
                    }`}
                  >
                    {w.text}
                  </span>{" "}
                </span>
              ))}
            </p>
          )}

          <div className="mt-[22px] flex flex-wrap gap-2.5">
            {CITES.map((c, i) => (
              <a
                key={c}
                href="#"
                className={`rounded-full border border-[rgba(255,79,46,.35)] bg-[rgba(255,79,46,.05)] px-3.5 py-[7px] font-mono text-[10px] uppercase tracking-[.14em] text-verm transition-[opacity,transform,background] duration-500 ease-silk hover:bg-[rgba(255,79,46,.12)] ${
                  i < citeCount ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                {c}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-[30px] text-center">
        <button
          type="button"
          onClick={() => phase !== "typing" && phase !== "answering" && setRun((r) => r + 1)}
          className="font-mono text-[10.5px] uppercase tracking-[.18em] text-mute transition-colors duration-300 hover:text-ivory"
        >
          ↻ Spela upp igen
        </button>
      </div>
    </div>
  );
}
