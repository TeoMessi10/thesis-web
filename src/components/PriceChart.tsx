"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "@/hooks/useMotion";

const DEFAULT_LINE =
  "M0,168 C26,160 44,170 68,152 S118,158 148,136 S206,148 238,116 S298,126 330,100 S388,112 418,76 S448,66 466,56";
const DEFAULT_AREA = `${DEFAULT_LINE} L466,230 L0,230 Z`;
const DEFAULT_END = { x: 466, y: 56 };

/**
 * Självritande prisgraf. stroke-dashoffset mäts med getTotalLength() —
 * därför refs (SVG-mätning är imperativ; detta är rätt React-mönster).
 * 2,1s draw-easing, area + punkt tänds vid 1750ms. RM ⇒ allt direkt.
 *
 * TODO(koppla): skicka in `linePath`/`areaPath`/`end` byggda från riktig prisdata.
 */
export default function PriceChart({
  linePath = DEFAULT_LINE,
  areaPath = DEFAULT_AREA,
  end = DEFAULT_END,
  gridLabels = ["480", "435", "390"],
  ariaLabel = "Prisutveckling 6 månader",
}: {
  linePath?: string;
  areaPath?: string;
  end?: { x: number; y: number };
  gridLabels?: [string, string, string] | string[];
  ariaLabel?: string;
}) {
  const [wrapRef, inView] = useInView<HTMLDivElement>({ threshold: 0.5, rootMargin: "0px" });
  const reduced = useReducedMotion();
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  /* Göm linjen tills den ska ritas (mätningen kräver mount) */
  useEffect(() => {
    const line = lineRef.current;
    if (!line || reduced) return;
    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
  }, [reduced, linePath]);

  useEffect(() => {
    if (!inView) return;
    const line = lineRef.current;
    const area = areaRef.current;
    const dot = dotRef.current;
    if (!line || !area || !dot) return;

    if (reduced) {
      line.style.strokeDashoffset = "0";
      area.style.opacity = "1";
      dot.setAttribute("opacity", "1");
      return;
    }
    line.style.transition = "stroke-dashoffset 2.1s cubic-bezier(.4,0,.2,1)";
    const raf = requestAnimationFrame(() => {
      line.style.strokeDashoffset = "0";
    });
    const t = setTimeout(() => {
      area.style.transition = "opacity 1.1s";
      area.style.opacity = "1";
      dot.setAttribute("opacity", "1");
    }, 1750);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [inView, reduced]);

  return (
    <div ref={wrapRef}>
      <svg className="block h-auto w-full" viewBox="0 0 520 230" role="img" aria-label={ariaLabel}>
        {[40, 100, 160].map((y, i) => (
          <g key={y}>
            <line x1="0" y1={y} x2="470" y2={y} stroke="rgba(242,234,219,.07)" />
            <text x="480" y={y + 4} fill="#8B8270" fontSize="10" fontFamily="var(--font-mono), monospace">
              {gridLabels[i]}
            </text>
          </g>
        ))}
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4F2E" stopOpacity=".18" />
            <stop offset="100%" stopColor="#FF4F2E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path ref={areaRef} d={areaPath} fill="url(#areaFill)" opacity="0" />
        <path ref={lineRef} d={linePath} fill="none" stroke="#FF4F2E" strokeWidth="2.4" strokeLinecap="round" />
        <circle ref={dotRef} cx={end.x} cy={end.y} r="4.5" fill="#FF4F2E" opacity="0">
          <animate attributeName="r" values="4.5;7;4.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
