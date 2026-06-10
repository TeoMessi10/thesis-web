/* Ticker — ren CSS-animation (46s loop), pausar på hover. Server-komponent.
   Får riktiga kurser via `ticks`-prop; utan data visas statiskt demoinnehåll. */

export type TickItem = [sym: string, price: string, delta: string, up: boolean];

const DEMO_TICKS: TickItem[] = [
  ["OMXS30", "2 547,21", "+0,42%", true],
  ["VOLV-B", "466,80", "+2,31%", true],
  ["ERIC-B", "78,42", "−0,18%", false],
  ["INVE-B", "318,50", "+1,04%", true],
  ["ATCO-A", "184,20", "+4,20%", true],
  ["SEB-A", "162,85", "−0,55%", false],
  ["HM-B", "168,30", "+0,92%", true],
  ["EVO", "742,00", "−1,40%", false],
  ["SAND", "228,40", "+0,66%", true],
  ["ABB", "612,90", "+1,12%", true],
];

export default function Ticker({ ticks }: { ticks?: TickItem[] }) {
  const source = ticks && ticks.length > 0 ? ticks : DEMO_TICKS;
  const items = [...source, ...source]; // dubblerat innehåll ⇒ sömlös -50%-loop
  return (
    <div
      aria-hidden="true"
      className="group relative flex h-[46px] items-center overflow-hidden border-t border-hair bg-[rgba(13,11,8,.6)] backdrop-blur-[10px]"
    >
      <div className="flex animate-tick whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {items.map(([sym, price, delta, up], i) => (
          <span key={i} className="inline-flex items-baseline gap-[9px] px-[26px] font-mono text-[11.5px] tracking-[.06em]">
            <b className="font-bold text-ivory">{sym}</b>
            <span className="text-ivory-2">{price}</span>
            <span className={up ? "text-sage" : "text-verm"}>{delta}</span>
            <span className="text-[#3A332A]">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
