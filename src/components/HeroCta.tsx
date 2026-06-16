"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Sökfunktionen kräver inloggning och bor på dashboarden. På den publika
   landningssidan visar vi i stället en CTA som leder dit: inloggade öppnar
   dashboarden direkt, utloggade slussas till inloggning/registrering. */
export default function HeroCta() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setLoggedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const primary =
    "inline-flex items-center gap-2.5 rounded-full bg-verm px-7 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[.14em] text-ink transition-[background,box-shadow,transform] duration-300 ease-silk hover:-translate-y-0.5 hover:bg-[#FF6044] hover:shadow-[0_10px_38px_rgba(255,79,46,.35)]";
  const secondary =
    "inline-flex items-center gap-2.5 rounded-full border border-hair-2 px-7 py-3.5 font-mono text-[12px] uppercase tracking-[.14em] text-ivory transition-colors duration-300 hover:border-ivory-2 hover:bg-[rgba(242,234,219,.05)]";

  /* Reservera höjd tills sessionen lästs — undviker layouthopp i hero. */
  if (loggedIn === null) return <div className="h-[52px]" aria-hidden="true" />;

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      {loggedIn ? (
        <>
          <Link href="/dashboard" className={primary}>
            Öppna dashboard <span aria-hidden="true">→</span>
          </Link>
          <Link href="/#bolag" className={secondary}>
            Se hur det fungerar
          </Link>
        </>
      ) : (
        <>
          <Link href="/signup" className={primary}>
            Kom igång gratis <span aria-hidden="true">→</span>
          </Link>
          <Link href="/login" className={secondary}>
            Logga in för att söka
          </Link>
        </>
      )}
    </div>
  );
}
