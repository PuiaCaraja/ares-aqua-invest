import { createServerFn } from "@tanstack/react-start";
import { interesseSchema } from "@/lib/interesse-schema";

// Public, narrowly scoped intake: no caller-controlled IDs, dates, reads, or updates.
export const registrarInteresse = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => interesseSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cotas_interesses").insert(data);
    if (error) throw new Error("Não foi possível salvar seu interesse. Tente novamente.");
    return { success: true };
  });