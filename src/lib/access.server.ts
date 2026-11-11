import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AccountRole = "admin" | "client";
type AccessDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      get_account_role: { Args: Record<string, never>; Returns: string };
    };
  };
};

export async function readAccountRole(supabase: SupabaseClient<Database>): Promise<AccountRole> {
  // Use the caller's authenticated client, so auth.uid() is derived from the verified bearer.
  const client = supabase as unknown as SupabaseClient<AccessDatabase>;
  setResponseHeader("Cache-Control", "no-store");
  try {
    const { data, error } = await client
      .rpc("get_account_role")
      .abortSignal(AbortSignal.timeout(5000));
    if (!error && (data === "admin" || data === "client")) return data;
  } catch {
    // No fallback to legacy roles or browser metadata when verification is unavailable.
  }
  setResponseStatus(503);
  throw new Error("Não foi possível verificar seu acesso. Tente novamente em instantes.");
}

export async function requireAdministrator(supabase: SupabaseClient<Database>): Promise<void> {
  if ((await readAccountRole(supabase)) !== "admin") {
    setResponseStatus(403);
    throw new Error("Acesso restrito ao administrador.");
  }
}
