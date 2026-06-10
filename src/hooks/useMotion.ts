"use client";

import { useEffect, useRef, useState } from "react";

/** prefers-reduced-motion som React-state (SSR-säker: false tills mount). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** true (default): triggar en gång och slutar observera. */
  once?: boolean;
}

/** IntersectionObserver → boolean. Detta ÄR React-mönstret för scroll-triggers. */
export function useInView<T extends HTMLElement>(
  { threshold = 0.16, rootMargin = "0px 0px -40px 0px", once = true }: InViewOptions = {},
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}
