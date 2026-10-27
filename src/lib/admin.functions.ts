import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Lead = {
  id: string;
  nome_cliente: string;
  email: string;
  categoria_cota: string;
  valor_investimento: number;
  data_criacao: string;
};

// Admin-only: verifies the caller's admin role before reading private leads.
export const listarInteresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { allowed: false as const, leads: [] as Lead[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cotas_interesses")
      .select("id, nome_cliente, email, categoria_cota, valor_investimento, data_criacao")
      .order("data_criacao", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os leads.");
    return { allowed: true as const, leads: (data ?? []).map((r) => ({ ...r, valor_investimento: Number(r.valor_investimento) })) };
  });
