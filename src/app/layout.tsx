import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Grain from "@/components/Grain";
import Nav from "@/components/Nav";
import { getQuotes, fmtPrice } from "@/lib/market";

/* Typsnitt via next/font. Variabelnamnen (--font-playfair osv.) refereras av
   @theme-tokensen i globals.css — egna namn för att undvika cirkelreferens
   mot Tailwinds --font-serif/--font-mono/--font-sans. */
const serif = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thesis — Förstå vilket bolag som helst på 30 sekunder",
  description:
    "AI-driven research för nordiska investerare. Varje påstående källhänvisat till exakt paragraf i rapporten.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* Riktig OMXS30-kurs i naven (EODHD, cachad 5 min). Saknas data döljs siffran. */
  const quotes = await getQuotes(["OMXS30"]);
  const omx = quotes.get("OMXS30");

  return (
    <html lang="sv" className={`${serif.variable} ${mono.variable} ${sans.variable}`}>
      <body className="bg-ink font-sans text-[16px] leading-[1.65] text-ivory">
        <Grain />
        <Nav omxPrice={omx ? fmtPrice(omx.price) : undefined} />
        {children}
      </body>
    </html>
  );
}
