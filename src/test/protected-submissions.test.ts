import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  insert: vi.fn(),
  ai: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: (validate: (input: unknown) => unknown) => ({
      handler: (handler: (ctx: { data: unknown }) => unknown) => (args: { data: unknown }) =>
        handler({ data: validate(args.data) }),
    }),
  }),
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => new Request("http://localhost"),
}));
vi.mock("@/lib/rate-limit.server", () => ({ enforceAbuseProtection: mocks.guard }));
vi.mock("@/lib/optional-user.server", () => ({ getOptionalUser: mocks.user }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => ({ insert: mocks.insert }) },
}));
vi.mock("@/lib/ai/responses.server", () => ({
  GATEWAY_BASE_URL: "https://example.com",
  createResponsesCall: mocks.ai,
}));

import { registrarInteresse } from "@/lib/interesses.functions";
import { registrarReserva } from "@/lib/reservas.functions";
import { analyzeCota } from "@/lib/cotas.functions";
import { interesseSchema } from "@/lib/interesse-schema";
import { reservaSchema } from "@/lib/reserva-schema";
import { submissionError } from "@/lib/abuse";

const interest = {
  nome_cliente: "Cliente",
  email: "cliente@example.com",
  categoria_cota: "Explorer",
  valor_investimento: 25000,
};
const reservation = { nome_cliente: "Cliente", data_reserva: "2099-12-31" };

describe("protected submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.guard.mockResolvedValue(undefined);
    mocks.user.mockResolvedValue(null);
    mocks.insert.mockResolvedValue({ error: null });
  });
  it("never writes interest or reservation when the quota denies the request", async () => {
    mocks.guard.mockRejectedValue(new Error("[RATE_LIMITED] Aguarde."));
    await expect(registrarInteresse({ data: interest })).rejects.toThrow("[RATE_LIMITED]");
    await expect(registrarReserva({ data: reservation })).rejects.toThrow("[RATE_LIMITED]");
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it("never calls the paid AI provider when the quota denies the request", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    try {
      mocks.guard.mockRejectedValue(new Error("[RATE_LIMITED] Aguarde."));
      await expect(analyzeCota({ data: { priorities: ["familia"] } })).rejects.toThrow(
        "[RATE_LIMITED]",
      );
      expect(mocks.ai).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("strips the honeypot before writing and ignores forged ownership", async () => {
    await registrarInteresse({
      data: { ...interest, website: "", user_id: "forged" } as typeof interest,
    });
    expect(mocks.insert).toHaveBeenCalledWith({ ...interest, user_id: null });
    await registrarReserva({ data: { ...reservation, website: "" } });
    expect(mocks.insert).toHaveBeenLastCalledWith({ ...reservation, user_id: null });
  });
  it("rejects honeypots server-side even with otherwise valid data", async () => {
    await expect(async () =>
      registrarInteresse({ data: { ...interest, website: "https://spam.example" } }),
    ).rejects.toThrow();
    await expect(async () =>
      registrarReserva({ data: { ...reservation, website: "spam" } }),
    ).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(interesseSchema.safeParse(interest).success).toBe(true);
    expect(reservaSchema.safeParse(reservation).success).toBe(true);
  });
  it("rejects impossible calendar dates instead of normalizing them", () => {
    expect(reservaSchema.safeParse({ ...reservation, data_reserva: "2099-02-31" }).success).toBe(
      false,
    );
  });
  it("shows safe protection messages while retaining generic errors for other failures", () => {
    expect(submissionError(new Error("[RATE_LIMITED] Aguarde 60 segundos."), "Falha.")).toBe(
      "Aguarde 60 segundos.",
    );
    expect(submissionError(new Error("[PROTECTION_UNAVAILABLE] Tente depois."), "Falha.")).toBe(
      "Tente depois.",
    );
    expect(submissionError(new Error("private SQL error"), "Falha.")).toBe("Falha.");
  });
});
