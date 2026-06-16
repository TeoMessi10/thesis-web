"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignup() {
    setLoading(true);
    setMessage(null);
    /* Verifieringslänken i mejlet ska landa på den riktiga domänen. I prod sätts
       NEXT_PUBLIC_SITE_URL (Vercel-domänen); annars används aktuell origin. */
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl}/login` },
    });
    setLoading(false);

    if (error) {
      setMessage(`Fel: ${error.message}`);
    } else {
      setMessage(
        "Konto skapat! Kolla din mejl för att verifiera adressen, logga sedan in."
      );
    }
  }

  return (
    <main style={{ padding: "4rem 2rem", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Skapa konto</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-post"
          style={{ padding: "0.75rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord (minst 6 tecken)"
          style={{ padding: "0.75rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
        />
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", border: "none", background: "#1a1a1a", color: "white", cursor: "pointer" }}
        >
          {loading ? "Skapar..." : "Skapa konto"}
        </button>
      </div>

      {message && <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>{message}</p>}

      <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
        Har du redan ett konto? <Link href="/login">Logga in</Link>
      </p>
    </main>
  );
}
