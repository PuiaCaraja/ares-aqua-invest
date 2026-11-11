import { createServerFn } from "@tanstack/react-start";
import { reservaSchema } from "@/lib/reserva-schema";

// Public, narrowly scoped intake: no caller-controlled IDs, dates, reads, or updates.
// When the visitor is signed in, the reservation is linked to their account (verified server-side).
export const registrarReserva = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reservaSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _website, ...submission } = data;
    const { enforceAbuseProtection } = await import("@/lib/rate-limit.server");
    await enforceAbuseProtection("reservation", { fingerprint: JSON.stringify(submission) });
    const { getOptionalUser } = await import("@/lib/optional-user.server");
    const user = await getOptionalUser();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reservas_vip")
      .insert({ ...submission, user_id: user?.id ?? null });
    if (error) throw new Error("Não foi possível salvar sua reserva. Tente novamente.");
    return { success: true, vinculadoConta: Boolean(user) };
  });
