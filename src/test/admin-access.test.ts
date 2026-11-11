import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  authMiddleware: {},
  rpc: vi.fn(),
  abortSignal: vi.fn(),
  status: vi.fn(),
  header: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let protectedFunction = false;
    let validate = (data: unknown): unknown => data;
    const builder = {
      middleware: (middlewares: unknown[]) => {
        protectedFunction = middlewares.includes(mocks.authMiddleware);
        return builder;
      },
      inputValidator: (validator: (data: unknown) => unknown) => {
        validate = validator;
        return builder;
      },
      handler: (handler: (ctx: unknown) => unknown) => async (args?: { data?: unknown }) => {
        if (!protectedFunction) throw new Error("Missing authentication middleware");
        if (!mocks.authenticated) throw new Error("Unauthorized");
        return handler({
          data: validate(args?.data),
          context: { userId: "verified-user", supabase: { rpc: mocks.rpc } },
        });
      },
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: mocks.authMiddleware,
}));
vi.mock("@tanstack/react-start/server", () => ({
  setResponseStatus: mocks.status,
  setResponseHeader: mocks.header,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from, auth: { admin: { createUser: mocks.createUser } } },
}));

import { criarConta, listarInteresses } from "@/lib/admin.functions";
import { getAccountAccess } from "@/lib/access.functions";

const clientAccount = { email: "CLIENTE@example.com", password: "Password-test-123" };

describe("administrator authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated = true;
    mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.abortSignal.mockResolvedValue({ data: "client", error: null });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ order: mocks.order });
    mocks.order.mockResolvedValue({ data: [], error: null });
    mocks.createUser.mockResolvedValue({ data: { user: { id: "new-client" } }, error: null });
  });

  it("denies unauthenticated callers for role, leads and account creation", async () => {
    mocks.authenticated = false;
    await expect(getAccountAccess()).rejects.toThrow("Unauthorized");
    await expect(listarInteresses()).rejects.toThrow("Unauthorized");
    await expect(criarConta({ data: clientAccount })).rejects.toThrow("Unauthorized");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it("recognizes ordinary logins as clients without granting administrative operations", async () => {
    await expect(getAccountAccess()).resolves.toEqual({ role: "client" });
    await expect(listarInteresses()).rejects.toThrow("Acesso restrito");
    await expect(criarConta({ data: clientAccount })).rejects.toThrow("Acesso restrito");
    expect(mocks.status).toHaveBeenCalledWith(403);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it("allows the database-verified primary administrator to read leads and create only clients", async () => {
    mocks.abortSignal.mockResolvedValue({ data: "admin", error: null });
    await expect(listarInteresses()).resolves.toEqual([]);
    await expect(criarConta({ data: clientAccount })).resolves.toEqual({
      email: "cliente@example.com",
    });
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "cliente@example.com",
      password: clientAccount.password,
      email_confirm: true,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("get_account_role");
    expect(mocks.rpc.mock.calls.every((args) => args.length === 1)).toBe(true);
  });
  it("rejects attempts to select or forge an administrator role in the request", async () => {
    mocks.abortSignal.mockResolvedValue({ data: "admin", error: null });
    await expect(
      criarConta({ data: { ...clientAccount, admin: true } as typeof clientAccount }),
    ).rejects.toThrow();
    await expect(
      criarConta({ data: { ...clientAccount, role: "admin" } as typeof clientAccount }),
    ).rejects.toThrow();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: { message: "missing migration" } },
    { data: "owner", error: null },
  ])("fails closed if database authorization cannot be verified: %j", async (result) => {
    mocks.abortSignal.mockResolvedValue(result);
    await expect(listarInteresses()).rejects.toThrow("Não foi possível verificar seu acesso");
    expect(mocks.status).toHaveBeenCalledWith(503);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("handles a network failure without granting access", async () => {
    mocks.abortSignal.mockRejectedValue(new Error("network"));
    await expect(criarConta({ data: clientAccount })).rejects.toThrow(
      "Não foi possível verificar seu acesso",
    );
    expect(mocks.status).toHaveBeenCalledWith(503);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it("explains an existing client account instead of trying to recreate it", async () => {
    mocks.abortSignal.mockResolvedValue({ data: "admin", error: null });
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { code: "email_exists" } });
    await expect(criarConta({ data: clientAccount })).rejects.toThrow("Esse e-mail já tem conta");
  });
});
