import { z } from "zod";
import { tiers } from "@/lib/cotas";
import { honeypotSchema } from "@/lib/abuse";

export const interesseSchema = z.object({
  website: honeypotSchema,
  nome_cliente: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(100, "O nome deve ter até 100 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(255)
    .transform((value) => value.toLowerCase()),
  categoria_cota: z
    .string()
    .refine((value) => tiers.some((tier) => tier.name === value), "Selecione uma cota disponível."),
  valor_investimento: z
    .number()
    .finite()
    .positive("Informe um valor maior que zero.")
    .max(999999999999.99)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.01,
      "Use no máximo duas casas decimais.",
    ),
});

export type InteresseInput = z.infer<typeof interesseSchema>;
