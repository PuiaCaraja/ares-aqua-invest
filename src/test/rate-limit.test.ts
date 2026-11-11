import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  status: vi.fn(),
  header: vi.fn(),
  rpc: vi.fn(),
  abortSignal: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: mocks.request,
  setResponseStatus: mocks.status,
  setResponseHeader: mocks.header,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: mocks.rpc },
}));

import { enforceAbuseProtection, hashSubject, requestIdentity } from "@/lib/rate-limit.server";

describe("server-side abuse protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "test-secret-at-least-thirty-two-characters");
    vi.stubEnv("RATE_LIMIT_TRUSTED_IP_HEADER", "");
    mocks.request.mockReturnValue({ headers: new Headers() });
    mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.abortSignal.mockResolvedValue({
      data: { allowed: true, retry_after: 0, rule: "" },
      error: null,
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("ignores caller-controlled forwarding headers by default", () => {
    expect(
      requestIdentity(
        new Headers({ "x-forwarded-for": "203.0.113.1", "x-real-ip": "203.0.113.2" }),
      ),
    ).toBe("shared");
  });
  it("accepts only the configured single-IP header", () => {
    expect(
      requestIdentity(new Headers({ "cf-connecting-ip": "203.0.113.1" }), "cf-connecting-ip"),
    ).toBe("ip:203.0.113.1");
    expect(requestIdentity(new Headers({ "x-real-ip": "2001:db8::1" }), "x-real-ip")).toBe(
      "ip:2001:db8::1",
    );
    expect(
      requestIdentity(new Headers({ "x-real-ip": "203.0.113.1, 203.0.113.2" }), "x-real-ip"),
    ).toBe("shared");
    expect(requestIdentity(new Headers(), "x-real-ip")).toBe("shared");
    expect(() => requestIdentity(new Headers(), "x-forwarded-for")).toThrow();
  });
  it("hashes identifiers with a secret and separates policy namespaces", () => {
    const hash = hashSubject("secret", "forms", "customer@example.com");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashSubject("secret", "forms", "customer@example.com"));
    expect(hash).not.toBe(hashSubject("another-secret", "forms", "customer@example.com"));
    expect(hash).not.toBe(hashSubject("secret", "ai", "customer@example.com"));
  });
  it("checks burst, hourly and global AI limits in one RPC before allowing work", async () => {
    await enforceAbuseProtection("ai");
    const rules = mocks.rpc.mock.calls[0]?.[1].p_rules;
    expect(
      rules.map((rule: { name: string; limit: number; window: number }) => [
        rule.name,
        rule.limit,
        rule.window,
      ]),
    ).toEqual([
      ["ai.ip.minute", 5, 60],
      ["ai.ip.hour", 20, 3600],
      ["ai.global.hour", 60, 3600],
    ]);
    expect(mocks.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
  it("shares form quotas between interest and reservation and hashes private payloads", async () => {
    await enforceAbuseProtection("interest", {
      email: "customer@example.com",
      fingerprint: "private-name-and-email",
    });
    await enforceAbuseProtection("reservation", { fingerprint: "private-name-and-date" });
    const first = mocks.rpc.mock.calls[0]?.[1].p_rules;
    const second = mocks.rpc.mock.calls[1]?.[1].p_rules;
    expect(first.slice(0, 3)).toEqual(second.slice(0, 3));
    expect(first.at(-1)).toMatchObject({ name: "interest.duplicate", limit: 1, window: 60 });
    expect(first[3]).toMatchObject({ name: "interest.email.hour", limit: 3, window: 3600 });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("customer@example.com");
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("private-name");
  });
  it("returns an identifiable 429 and retry delay without logging personal data", async () => {
    mocks.abortSignal.mockResolvedValue({
      data: { allowed: false, retry_after: 42, rule: "ai.ip.minute" },
      error: null,
    });
    await expect(enforceAbuseProtection("ai")).rejects.toThrow(
      "[RATE_LIMITED] Muitas tentativas. Aguarde 42 segundos",
    );
    expect(mocks.status).toHaveBeenCalledWith(429);
    expect(mocks.header).toHaveBeenCalledWith("Retry-After", "42");
    expect(console.warn).toHaveBeenCalledWith(
      JSON.stringify({
        event: "abuse.rate_limited",
        action: "ai",
        rule: "ai.ip.minute",
        retryAfter: 42,
      }),
    );
  });
  it.each([
    { data: null, error: { message: "missing migration" } },
    { data: {}, error: null },
    { data: { allowed: false, retry_after: 0, rule: "" }, error: null },
  ])("fails closed on database errors and invalid decisions: %j", async (result) => {
    mocks.abortSignal.mockResolvedValue(result);
    await expect(enforceAbuseProtection("ai")).rejects.toThrow("[PROTECTION_UNAVAILABLE]");
    expect(mocks.status).toHaveBeenCalledWith(503);
    expect(mocks.header).toHaveBeenCalledWith("Retry-After", "30");
  });
  it("fails closed on network timeouts", async () => {
    mocks.abortSignal.mockRejectedValue(new Error("timeout"));
    await expect(enforceAbuseProtection("interest")).rejects.toThrow("[PROTECTION_UNAVAILABLE]");
  });
  it("requires a strong secret before any database operation", async () => {
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "short");
    await expect(enforceAbuseProtection("ai")).rejects.toThrow("[PROTECTION_UNAVAILABLE]");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
