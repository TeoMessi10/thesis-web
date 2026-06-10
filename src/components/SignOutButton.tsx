"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={`rounded-full border border-hair-2 px-[22px] py-2.5 font-mono text-[11px] uppercase tracking-[.14em] text-ivory-2 transition-colors duration-300 hover:border-ivory-2 hover:bg-[rgba(242,234,219,.05)] hover:text-ivory disabled:opacity-50 ${className}`}
    >
      {loading ? "Loggar ut…" : "Logga ut"}
    </button>
  );
}
