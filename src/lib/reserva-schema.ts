import { z } from "zod";
import { honeypotSchema } from "@/lib/abuse";

export const reservaSchema = z.object({
  website: honeypotSchema,
  nome_cliente: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(100, "O nome deve ter até 100 caracteres."),
  data_reserva: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return false;
      if (date.toISOString().slice(0, 10) !== value) return false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return date.getTime() >= today.getTime();
    }, "Escolha uma data a partir de hoje."),
});

export type ReservaInput = z.infer<typeof reservaSchema>;
