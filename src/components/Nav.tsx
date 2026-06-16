"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NavAuth from "@/components/NavAuth";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { fmtPrice } from "@/lib/format";
import type { Quote } from "@/lib/quote";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Översikt" },
  { href: "/#bolag", label: "Bolag" },
  { href: "/#teser", label: "Teser" },
  { href: "/#fraga", label: "Fråga" },
  { href: "/#pris", label: "Pris" },
];

export default function Nav({ initialOmx }: { initialOmx?: Quote }) {
  const [scrolled, setScrolled] = useState(false);
  const { quotes } = useLiveQuotes(["OMXS30"], initialOmx ? { OMXS30: initialOmx } : {});
  const omx = quotes.OMXS30;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background,border-color,backdrop-filter] duration-[450ms] ease-silk ${
        scrolled
          ? "border-hair bg-[rgba(13,11,8,.78)] backdrop-blur-[16px]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-wrap items-center gap-10 px-12 max-[1100px]:px-8 max-[640px]:px-5">
        <Link href="/" aria-label="Thesis — start" className="group mr-2 flex items-center gap-[11px]">
          <span className="h-[15px] w-[15px] rotate-45 bg-verm shadow-[0_0_18px_rgba(255,79,46,.45)] transition-transform duration-[600ms] ease-silk group-hover:rotate-[225deg]" />
          <span className="font-serif text-[23px] font-extrabold tracking-[.01em]">Thesis</span>
        </Link>

        <div className="flex flex-1 gap-8 max-[1100px]:hidden">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative py-1.5 font-mono text-[11px] uppercase tracking-[.18em] transition-colors duration-300 hover:text-ivory ${
                i === 0
                  ? "text-ivory after:absolute after:-bottom-[3px] after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-verm after:content-['']"
                  : "text-ivory-2"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-[18px]">
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[.14em] text-ivory-2 max-[640px]:hidden">
            <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-verm motion-reduce:animate-none" />
            LIVE
          </span>
          {/* Visas bara med riktig kurs — inga påhittade siffror. */}
          {omx && (
            <span className="font-mono text-[11px] tracking-[.1em] text-mute max-[640px]:hidden">
              OMXS30&nbsp;&nbsp;<span className="tabular-nums">{fmtPrice(omx.price)}</span>
            </span>
          )}
          <NavAuth />
        </div>
      </div>
    </nav>
  );
}
