import { z } from "zod";

// Secondary bot signal. Rate limits remain mandatory even when this field is omitted.
export const honeypotSchema = z.string().max(0, "Não foi possível validar o envio.").optional();

export function submissionError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  return /^\[(RATE_LIMITED|PROTECTION_UNAVAILABLE)\]/.test(message)
    ? message.replace(/^\[[A-Z_]+\]\s*/, "")
    : fallback;
}
