import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getRequest, setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Attempt quotas, shared by all server instances. Change policies here, never in the browser.
export const ABUSE_LIMITS = {
  ai: { burst: 5, hourly: 20, globalHourly: 60 },
  forms: { burst: 5, daily: 20, globalHourly: 200, emailHourly: 3, duplicateSeconds: 60 },
} as const;

type RateLimitDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      enforce_request_limits: { Args: { p_rules: Json }; Returns: Json };
    };
  };
};

const decisionSchema = z.object({
  allowed: z.boolean(),
  retry_after: z.number().int().min(0).max(86400),
  rule: z.string().max(80),
});

// Trust only a single-IP header overwritten by a controlled reverse proxy.
// With no trusted header all anonymous traffic shares one bucket (safe local default).
export function requestIdentity(headers: Headers, trustedHeader?: string): string {
  if (!trustedHeader) return "shared";
  if (!["cf-connecting-ip", "x-real-ip"].includes(trustedHeader)) {
    throw new Error("Unsupported RATE_LIMIT_TRUSTED_IP_HEADER");
  }
  const ip = headers.get(trustedHeader)?.trim().toLowerCase();
  return ip && isIP(ip) ? `ip:${ip}` : "shared";
}

export function hashSubject(secret: string, rule: string, subject: string): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify([rule, subject]))
    .digest("hex");
}

function unavailable(): never {
  console.warn(JSON.stringify({ event: "abuse.protection_unavailable" }));
  setResponseStatus(503);
  setResponseHeader("Retry-After", "30");
  setResponseHeader("Cache-Control", "no-store");
  throw new Error(
    "[PROTECTION_UNAVAILABLE] A proteção de envios está indisponível. Tente novamente em 30 segundos.",
  );
}

export async function enforceAbuseProtection(
  action: "ai" | "interest" | "reservation",
  input?: { email?: string; fingerprint?: string },
): Promise<void> {
  const rules: Array<{ key: string; name: string; limit: number; window: number }> = [];
  try {
    const secret = process.env["RATE_LIMIT_HASH_SECRET"];
    if (!secret || secret.length < 32) return unavailable();
    const identity = requestIdentity(
      getRequest().headers,
      process.env["RATE_LIMIT_TRUSTED_IP_HEADER"] || undefined,
    );
    const add = (name: string, subject: string, limit: number, window: number) => {
      rules.push({ key: hashSubject(secret, name, subject), name, limit, window });
    };
    if (action === "ai") {
      add("ai.ip.minute", identity, ABUSE_LIMITS.ai.burst, 60);
      add("ai.ip.hour", identity, ABUSE_LIMITS.ai.hourly, 3600);
      add("ai.global.hour", "all", ABUSE_LIMITS.ai.globalHourly, 3600);
    } else {
      add("forms.ip.ten_minutes", identity, ABUSE_LIMITS.forms.burst, 600);
      add("forms.ip.day", identity, ABUSE_LIMITS.forms.daily, 86400);
      add("forms.global.hour", "all", ABUSE_LIMITS.forms.globalHourly, 3600);
      if (input?.email)
        add(
          "interest.email.hour",
          input.email.trim().toLowerCase(),
          ABUSE_LIMITS.forms.emailHourly,
          3600,
        );
      if (input?.fingerprint)
        add(`${action}.duplicate`, input.fingerprint, 1, ABUSE_LIMITS.forms.duplicateSeconds);
    }
    const client = supabaseAdmin as unknown as SupabaseClient<RateLimitDatabase>;
    const { data, error } = await client
      .rpc("enforce_request_limits", { p_rules: rules })
      .abortSignal(AbortSignal.timeout(5000));
    if (error) return unavailable();
    const parsed = decisionSchema.safeParse(data);
    if (!parsed.success || (!parsed.data.allowed && parsed.data.retry_after < 1))
      return unavailable();
    if (!parsed.data.allowed) {
      const { retry_after: retryAfter, rule } = parsed.data;
      console.warn(JSON.stringify({ event: "abuse.rate_limited", action, rule, retryAfter }));
      setResponseStatus(429);
      setResponseHeader("Retry-After", String(retryAfter));
      setResponseHeader("Cache-Control", "no-store");
      throw new Error(
        `[RATE_LIMITED] Muitas tentativas. Aguarde ${retryAfter} segundos antes de tentar novamente.`,
      );
    }
  } catch (error) {
    if (error instanceof Error && /^\[(RATE_LIMITED|PROTECTION_UNAVAILABLE)\]/.test(error.message))
      throw error;
    return unavailable();
  }
}
