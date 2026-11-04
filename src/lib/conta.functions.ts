import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MinhaConta = {
  email: string | null;
  cotas: Array<{ id: string; categoria_cota: string; valor_investimento: number; status: string; data_criacao: string }>;
  reservas: Array<{ id: string; data_reserva: string; created_at: string }>;
  historico: Array<{ id: string; cota_recomendada: string | null; pergunta_usuario: string; data_interacao: string }>;
};

// Signed-in client: reads only rows linked to the verified user id (or, for leads, their confirmed e-mail).
// Tables stay locked to clients; the service role is used only after the token is verified.
export const minhaConta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MinhaConta> => {
    const userId = context.userId;
    const email = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let cotasQuery = supabaseAdmin
      .from("cotas_interesses")
      .select("id, categoria_cota, valor_investimento, status, data_criacao")
      .order("data_criacao", { ascending: false });
    cotasQuery = email ? cotasQuery.or(`user_id.eq.${userId},email.eq."${email}"`) : cotasQuery.eq("user_id", userId);

    const [cotas, reservas, historico] = await Promise.all([
      cotasQuery,
      supabaseAdmin.from("reservas_vip").select("id, data_reserva, created_at").eq("user_id", userId).order("data_reserva", { ascending: true }),
      supabaseAdmin
        .from("historico_ia")
        .select("id, cota_recomendada, pergunta_usuario, data_interacao")
        .eq("user_id", userId)
        .order("data_interacao", { ascending: false })
        .limit(20),
    ]);
    if (cotas.error || reservas.error || historico.error) throw new Error("Não foi possível carregar sua conta.");
    return {
      email,
      cotas: (cotas.data ?? []).map((c) => ({ ...c, valor_investimento: Number(c.valor_investimento) })),
      reservas: reservas.data ?? [],
      historico: historico.data ?? [],
    };
  });
