"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion } from "@/hooks/useMotion";

/** Scroll-reveal: fade + 34px lyft, 1s silk-easing, valfri delay (ms). */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const on = inView || reduced;

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-1000 ease-silk motion-reduce:transition-none ${
        on ? "translate-y-0 opacity-100" : "translate-y-[34px] opacity-0"
      } ${className}`}
      style={reduced ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const fmt = (v: number, dec: number) => v.toFixed(dec).replace(".", ",");

/** Räknar upp till `value` (sv-SE-format) när elementet syns. 1300ms, ease-out cubic. */
export function CountUp({
  value,
  decimals = 0,
  className = "",
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.6, rootMargin: "0px" });
  const reduced = useReducedMotion();
  const [text, setText] = useState(fmt(0, decimals));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setText(fmt(value, decimals));
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1300;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setText(fmt(value * e, decimals));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value, decimals]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
