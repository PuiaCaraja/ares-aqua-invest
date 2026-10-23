import { describe, expect, it } from "vitest";
import { interesseSchema } from "@/lib/interesse-schema";

const submission = { nome_cliente: "Cliente Teste", email: "cliente@example.com", categoria_cota: "Explorer", valor_investimento: 25000 };

describe("Interest submission validation", () => {
  it("accepts the requested text fields and a numeric investment", () => {
    expect(interesseSchema.parse(submission)).toEqual(submission);
  });
  it("rejects invalid email", () => {
    expect(interesseSchema.safeParse({ ...submission, email: "invalid" }).success).toBe(false);
  });
  it("rejects missing customer name", () => {
    expect(interesseSchema.safeParse({ ...submission, nome_cliente: " " }).success).toBe(false);
  });
  it("rejects unavailable categories", () => {
    expect(interesseSchema.safeParse({ ...submission, categoria_cota: "Unknown" }).success).toBe(false);
  });
  it("rejects a negative investment", () => {
    expect(interesseSchema.safeParse({ ...submission, valor_investimento: -1 }).success).toBe(false);
  });
});