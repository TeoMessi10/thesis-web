"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(`Fel: ${error.message}`);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main style={{ padding: "4rem 2rem", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Logga in</h1>

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
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Lösenord"
          style={{ padding: "0.75rem", fontSize: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", border: "none", background: "#1a1a1a", color: "white", cursor: "pointer" }}
        >
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </div>

      {error && <p style={{ marginTop: "1rem", color: "red", fontSize: "0.9rem" }}>{error}</p>}

      <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
        Inget konto? <Link href="/signup">Skapa ett</Link>
      </p>
    </main>
  );
}
