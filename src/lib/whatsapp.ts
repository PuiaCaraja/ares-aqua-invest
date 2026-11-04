/**
 * Número de atendimento no formato internacional, só dígitos (ex.: "5511999999999").
 * Vazio = o link abre o WhatsApp para o cliente escolher o contato.
 */
export const WHATSAPP_NUMBER = "";

export type AtendimentoTipo = "cota" | "reserva";

export function buildWhatsAppMessage(input: { nome: string; tipo: AtendimentoTipo; detalhe: string }): string {
  const primeiroNome = input.nome.trim().split(/\s+/)[0] || input.nome.trim();
  return input.tipo === "cota"
    ? `Olá! Sou ${primeiroNome} e acabei de registrar interesse na cota ${input.detalhe} do Ares Aquatics. Gostaria de falar com um especialista.`
    : `Olá! Sou ${primeiroNome} e acabei de reservar uma mesa VIP no Bar Subaquático do Ares Aquatics para ${input.detalhe}. Gostaria de confirmar os detalhes.`;
}

export function buildWhatsAppLink(input: { nome: string; tipo: AtendimentoTipo; detalhe: string }, number = WHATSAPP_NUMBER): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsAppMessage(input))}`;
}
