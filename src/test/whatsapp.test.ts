import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "@/lib/whatsapp";

describe("WhatsApp support link", () => {
  it("includes the client's name and chosen cota in the prefilled message", () => {
    const link = buildWhatsAppLink({ nome: "Leila Puia", tipo: "cota", detalhe: "Terraformer" }, "+55 11 99999-0000");
    expect(link.startsWith("https://wa.me/5511999990000?text=")).toBe(true);
    const text = decodeURIComponent(link.split("?text=")[1]!);
    expect(text).toContain("Leila");
    expect(text).toContain("Terraformer");
  });
  it("works without a configured number", () => {
    expect(buildWhatsAppLink({ nome: "Ana", tipo: "reserva", detalhe: "15/11/2026" }, "").startsWith("https://wa.me/?text=")).toBe(true);
  });
});
