import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayRunIdFetch } from "./run-id";

export const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  system?: string,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(config.model),
    ...(system ? { system } : {}),
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return { result, runIdFetch };
}
