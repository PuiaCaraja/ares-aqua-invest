import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), access: vi.fn() }));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.user } } }));
vi.mock("@/lib/access.functions", () => ({ getAccountAccess: mocks.access }));
import { Route } from "@/routes/admin";

describe("admin route guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ data: { user: { id: "signed-in" } } });
  });
  const enter = () => Route.options.beforeLoad?.({} as never);

  it("disables SSR to avoid rendering private data before verification", () => {
    expect(Route.options.ssr).toBe(false);
  });
  it("sends visitors to sign in without asking for administrative data", async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    await expect(enter()).rejects.toMatchObject({ options: { to: "/auth" } });
    expect(mocks.access).not.toHaveBeenCalled();
  });
  it("sends signed-in clients to their own account", async () => {
    mocks.access.mockResolvedValue({ role: "client" });
    await expect(enter()).rejects.toMatchObject({ options: { to: "/minha-conta" } });
  });
  it("allows only the server-verified administrator", async () => {
    mocks.access.mockResolvedValue({ role: "admin" });
    await expect(enter()).resolves.toBeUndefined();
  });
  it("stops entry when the role verification fails", async () => {
    mocks.access.mockRejectedValue(new Error("verification unavailable"));
    await expect(enter()).rejects.toThrow("verification unavailable");
  });
});
