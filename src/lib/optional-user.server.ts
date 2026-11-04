import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

export type OptionalUser = { id: string; email: string | null };

/**
 * Returns the signed-in visitor when a valid bearer token was sent, otherwise null.
 * Used by public intake functions to link submissions to the client's account
 * without requiring sign-in.
 */
export async function getOptionalUser(): Promise<OptionalUser | null> {
  try {
    const header = getRequest()?.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const token = header.slice(7);
    if (token.split(".").length !== 3) return null;
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;
    const client = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    const email = typeof data.claims.email === "string" ? data.claims.email.toLowerCase() : null;
    return { id: data.claims.sub, email };
  } catch {
    return null;
  }
}
