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
    const { requireAdministrator } = await import("@/lib/access.server");
    await requireAdministrator(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cotas_interesses")
      .select("id, nome_cliente, email, categoria_cota, valor_investimento, data_criacao, user_id")
      .order("data_criacao", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os leads.");
    return (data ?? []).map((r) => ({ ...r, valor_investimento: Number(r.valor_investimento) }));
  });

const contaSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .max(255)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
  })
  .strict();

// Only the primary administrator can create client accounts. Role selection is never accepted.
export const criarConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdministrator } = await import("@/lib/access.server");
    await requireAdministrator(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user)
      throw new Error(
        error?.code === "email_exists" ||
          error?.code === "user_already_exists" ||
          error?.message.toLowerCase().includes("already")
          ? "Esse e-mail já tem conta. Use o login ou o link mágico."
          : error?.code === "weak_password"
            ? "Escolha uma senha mais forte."
            : "Não foi possível criar a conta de cliente.",
      );
    return { email: data.email };
  });
