import { createServerFn } from "@tanstack/react-start";
import { interesseSchema } from "@/lib/interesse-schema";

// Public, narrowly scoped intake: no caller-controlled IDs, dates, reads, or updates.
// When the visitor is signed in, the lead is linked to their account (verified server-side).
export const registrarInteresse = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => interesseSchema.parse(input))
  .handler(async ({ data }) => {
    const { getOptionalUser } = await import("@/lib/optional-user.server");
    const user = await getOptionalUser();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cotas_interesses").insert({ ...data, user_id: user?.id ?? null });
    if (error) throw new Error("Não foi possível salvar seu interesse. Tente novamente.");
    return { success: true, vinculadoConta: Boolean(user) };
  });
