import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase-klient för Server Components, Route Handlers och Server Actions. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Anrop från en Server Component — kan ignoreras eftersom
            // middleware uppdaterar sessionen.
          }
        },
      },
    }
  );
}
