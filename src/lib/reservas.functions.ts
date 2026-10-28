import { createServerFn } from "@tanstack/react-start";
import { reservaSchema } from "@/lib/reserva-schema";

// Public, narrowly scoped intake: no caller-controlled IDs, dates, reads, or updates.
export const registrarReserva = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reservaSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reservas_vip").insert(data);
    if (error) throw new Error("Não foi possível salvar sua reserva. Tente novamente.");
    return { success: true };
  });
