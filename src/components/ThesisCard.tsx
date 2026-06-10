/* Tes-kort med status (Bruten/Stärkt/Bevakas), sparkline mot streckad tröskel
   och toppkant i statusfärg. Server-komponent — interaktionen är ren CSS-hover. */

export type ThesisStatus = "broken" | "strong" | "watch";

const STATUS: Record<
  ThesisStatus,
  { label: string; hex: string; pill: string; line: string }
> = {
  broken: {
    label: "Bruten",
    hex: "#FF4F2E",
    pill: "text-verm bg-[rgba(255,79,46,.1)] border-[rgba(255,79,46,.3)]",
    line: "via-verm",
  },
  strong: {
    label: "Stärkt",
    hex: "#95BA74",
    pill: "text-sage bg-[rgba(149,186,116,.09)] border-[rgba(149,186,116,.28)]",
    line: "via-sage",
  },
  watch: {
    label: "Bevakas",
    hex: "#C9A063",
    pill: "text-brass bg-[rgba(201,160,99,.09)] border-[rgba(201,160,99,.3)]",
    line: "via-brass",
  },
};

export interface ThesisCardProps {
  status: ThesisStatus;
  question: string;
  company: string;
  thresholdLabel: string;
  thresholdY: number; // y i 280×70-viewBoxen
  points: string; // polyline-punkter
  endX: number;
  endY: number;
  note: React.ReactNode;
}

export default function ThesisCard({
  status,
  question,
  company,
  thresholdLabel,
  thresholdY,
  points,
  endX,
  endY,
  note,
}: ThesisCardProps) {
  const s = STATUS[status];
  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-hair bg-[linear-gradient(180deg,rgba(26,22,16,.55),rgba(19,16,11,.3))] px-7 pb-[26px] pt-[30px] backdrop-blur-[10px] transition-[transform,border-color,box-shadow] duration-[450ms] ease-silk hover:-translate-y-[7px] hover:border-hair-2 hover:shadow-[0_30px_70px_rgba(0,0,0,.45)]">
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent opacity-70 ${s.line}`}
      />
      <span
        className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-[7px] font-mono text-[10px] font-bold tracking-[.2em] uppercase ${s.pill}`}
      >
        <i className="h-1.5 w-1.5 rounded-full bg-current not-italic" />
        {s.label}
      </span>
      <h3 className="mb-2 font-serif text-[21px] font-bold leading-[1.32]">{question}</h3>
      <div className="mb-[22px] font-mono text-[11px] font-medium uppercase tracking-[.2em] text-mute">{company}</div>

      <svg className="mb-[18px] block h-auto w-full" viewBox="0 0 280 70" aria-hidden="true">
        <line x1="0" y1={thresholdY} x2="280" y2={thresholdY} stroke={s.hex} strokeWidth="1" strokeDasharray="4 5" opacity=".5" />
        <text x="0" y={thresholdY - 6} fill="#8B8270" fontSize="9" fontFamily="var(--font-mono), monospace">
          {thresholdLabel}
        </text>
        <polyline points={points} fill="none" stroke="#F2EADB" strokeWidth="1.6" opacity=".75" />
        <circle cx={endX} cy={endY} r="4" fill={s.hex} />
      </svg>

      <p className="border-t border-hair pt-4 text-[12.8px] leading-[1.6] text-mute [&_b]:font-semibold [&_b]:text-ivory-2">
        {note}
      </p>
    </article>
  );
}
