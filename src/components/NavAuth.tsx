"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";

/** Växlar mellan "Logga in" och "Dashboard + Logga ut" beroende på session. */
export default function NavAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* Reserverad bredd tills sessionen lästs — undviker layouthopp i nav. */
  if (!ready) return <span className="inline-block h-10 w-[110px]" aria-hidden="true" />;

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-hair-2 px-[22px] py-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-ivory transition-colors duration-300 hover:border-ivory-2 hover:bg-[rgba(242,234,219,.05)]"
      >
        Logga in
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <Link
        href="/dashboard"
        className="rounded-full border border-[rgba(255,79,46,.4)] bg-[rgba(255,79,46,.06)] px-[22px] py-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-verm transition-colors duration-300 hover:border-verm hover:bg-[rgba(255,79,46,.12)]"
      >
        Dashboard
      </Link>
      <SignOutButton />
    </span>
  );
}
