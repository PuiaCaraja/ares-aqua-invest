import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { GATEWAY_BASE_URL, createResponsesCall } from "./ai/responses.server";
import { tiers } from "./cotas";

const inputSchema = z.object({
  priorities: z.array(z.string().min(1).max(80)).min(1).max(6),
  notes: z.string().max(600).optional(),
});

const analysisSchema = z.object({
  summary: z.string(),
  ranking: z.array(
    z.object({
      tier: z.string(),
      score: z.number().min(0).max(100),
      verdict: z.string(),
    }),
  ),
  matches: z.array(
    z.object({
      tier: z.string(),
      benefits: z.array(z.string()),
      why: z.string(),
    }),
  ),
});

export type CotaAnalysis = {
  summary: string;
  ranking: { tier: string; score: number; verdict: string }[];
  matches: { tier: string; benefits: string[]; why: string }[];
};

export const analyzeCota = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Selecione ao menos uma prioridade antes de analisar.");
    return parsed.data;
  })
  .handler(async ({ data }): Promise<CotaAnalysis> => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("O consultor de IA não está configurado neste app.");

    const brlFmt = (n: number) =>
      `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} coins`;
    const tierText = tiers
      .map((t) => `- ${t.name} (${brlFmt(t.price)}, retorno estimado ${t.yieldPct}% a.a.): ${t.perks.join("; ")}`)
      .join("\n");

    const system = `Você é o consultor de cotas do Ares Aquatics, um parque aquático fictício em Marte (projeto de demonstração). Ajude potenciais compradores a escolher entre as cotas abaixo.

COTAS DISPONÍVEIS
${tierText}

Compare as cotas com base nas prioridades informadas pelo comprador. Responda APENAS com um JSON válido, sem nenhum texto fora do JSON, exatamente neste formato:
{"summary": "recomendação direta em português, 2-3 frases", "ranking": [{"tier": "nome exato da cota", "score": 85, "verdict": "uma frase em português"}], "matches": [{"tier": "nome exato da cota", "benefits": ["benefícios específicos desta cota que atendem às prioridades"], "why": "explicação em português, 1-2 frases"}]}

Regras: use somente os nomes de cota fornecidos acima; cite apenas benefícios que existem na lista de cada cota; ajuste os scores (0-100) às prioridades do comprador; inclua as três cotas no ranking, ordenado da melhor para a pior; escreva tudo em português do Brasil.`;

    const userContent = `Minhas prioridades: ${data.priorities.join("; ")}.${data.notes ? ` Observações: ${data.notes}` : ""}`;

    const request = getRequest();
    const { result } = createResponsesCall(
      request,
      { baseURL: GATEWAY_BASE_URL, apiKey, model: "openai/gpt-6-astra" },
      [{ role: "user", content: userContent }],
      system,
    );

    const text = await result.text;
    const analysis = parseAnalysis(text);
    await logInteraction(userContent, analysis);
    return analysis;
  });

function parseAnalysis(text: string): CotaAnalysis {
  const fallback = { summary: text.trim().slice(0, 1200), ranking: [], matches: [] };
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return fallback;
  try {
    const out = analysisSchema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return out.success ? out.data : fallback;
  } catch {
    return fallback;
  }
}

// Logging never blocks the user's answer.
async function logInteraction(pergunta: string, analysis: CotaAnalysis) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("historico_ia").insert({
      pergunta_usuario: pergunta,
      resposta_ia: JSON.stringify(analysis),
      cota_recomendada: analysis.ranking[0]?.tier ?? null,
    });
    if (error) console.error("historico_ia insert failed", error.message);
  } catch (e) {
    console.error("historico_ia insert failed", e);
  }
}
