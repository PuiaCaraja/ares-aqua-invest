import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Lead = {
  id: string;
  nome_cliente: string;
  email: string;
  categoria_cota: string;
  valor_investimento: number;
  data_criacao: string;
  user_id: string | null;
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
      .select("id, nome_cliente, email, categoria_cota, valor_investimento, data_criacao, user_id")
      .order("data_criacao", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os leads.");
    return { allowed: true as const, leads: (data ?? []).map((r) => ({ ...r, valor_investimento: Number(r.valor_investimento) })) };
  });

// TEMPORÁRIO (demonstração): leitura pública dos leads, sem login.
// A tabela segue protegida no banco (sem acesso anônimo); só esta função lê.
// Para reverter: apague esta função e volte a rota /admin para _authenticated.
export const listarInteressesPublico = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cotas_interesses")
      .select("id, nome_cliente, email, categoria_cota, valor_investimento, data_criacao, user_id")
      .order("data_criacao", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os leads.");
    return (data ?? []).map((r) => ({ ...r, valor_investimento: Number(r.valor_investimento) }));
  });

const contaSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
  admin: z.boolean(),
});

// Admin-only: creates a confirmed account (public sign-up is disabled).
export const criarConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Sem permissão.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message.includes("already") ? "Esse e-mail já tem conta." : "Não foi possível criar a conta.");
    if (data.admin) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
      if (roleError) throw new Error("Conta criada, mas não foi possível torná-la administradora.");
    }
    return { email: data.email };
  });
