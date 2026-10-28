import { describe, expect, it } from "vitest";
import { reservaSchema } from "@/lib/reserva-schema";

const tomorrow = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

describe("reservaSchema", () => {
  it("aceita nome e data futura válidos", () => {
    const parsed = reservaSchema.safeParse({ nome_cliente: "Leila Puia", data_reserva: tomorrow() });
    expect(parsed.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const parsed = reservaSchema.safeParse({ nome_cliente: "   ", data_reserva: tomorrow() });
    expect(parsed.success).toBe(false);
  });

  it("rejeita data no passado", () => {
    const parsed = reservaSchema.safeParse({ nome_cliente: "Leila Puia", data_reserva: "2020-01-01" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Escolha uma data a partir de hoje.");
    }
  });

  it("rejeita data fora do formato esperado", () => {
    const parsed = reservaSchema.safeParse({ nome_cliente: "Leila Puia", data_reserva: "28/10/2026" });
    expect(parsed.success).toBe(false);
  });
});
