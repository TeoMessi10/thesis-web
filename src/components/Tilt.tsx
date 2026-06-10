"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useMotion";

/* Dynamiska transformvärden per musposition kan inte vara Tailwind-klasser —
   dokumenterat inline-style-undantag. */

/** pointer:fine som SSR-säker state (false på server ⇒ inga handlers förrän mount). */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);
  return fine;
}

/** 3D-tilt på barnet (max ~2,1°/2,5°), mjuk återgång vid mouseleave. */
export function TiltShowcase({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const inner = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const active = fine && !reduced;

  return (
    <div
      className={`[perspective:1600px] ${className}`}
      onMouseMove={
        active
          ? (e) => {
              const el = inner.current;
              if (!el) return;
              const r = e.currentTarget.getBoundingClientRect();
              const nx = (e.clientX - r.left) / r.width - 0.5;
              const ny = (e.clientY - r.top) / r.height - 0.5;
              el.style.transition = "transform .25s ease-out";
              el.style.transform = `rotateX(${(-ny * 2.1).toFixed(2)}deg) rotateY(${(nx * 2.5).toFixed(2)}deg)`;
            }
          : undefined
      }
      onMouseLeave={
        active
          ? () => {
              const el = inner.current;
              if (!el) return;
              el.style.transition = "transform .8s cubic-bezier(.22,.68,.22,1)";
              el.style.transform = "rotateX(0deg) rotateY(0deg)";
            }
          : undefined
      }
    >
      <div ref={inner} className="[transform-style:preserve-3d]">
        {children}
      </div>
    </div>
  );
}

/** Magnetisk CTA — knappen följer pekaren några px och släpper mjukt. */
export function MagneticButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLButtonElement>(null);
  const active = fine && !reduced;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={
        active
          ? (e) => {
              const el = ref.current;
              if (!el) return;
              const r = el.getBoundingClientRect();
              const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
              const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
              el.style.transition = "";
              el.style.transform = `translate(${(x * 8).toFixed(1)}px,${(y * 5).toFixed(1)}px)`;
            }
          : undefined
      }
      onMouseLeave={
        active
          ? () => {
              const el = ref.current;
              if (!el) return;
              el.style.transition = "transform .5s cubic-bezier(.22,.68,.22,1)";
              el.style.transform = "translate(0,0)";
            }
          : undefined
      }
      className={`will-change-transform ${className}`}
    >
      {children}
    </button>
  );
}
