import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provedor de IA do sistema.
 *
 * Por padrão usa o gateway da Lovable (LOVABLE_API_KEY). Fora da Lovable, basta
 * definir as variáveis abaixo para apontar para qualquer provedor compatível com
 * a API da OpenAI (OpenAI, OpenRouter, Groq, Gemini via endpoint compatível...):
 *
 *   AI_API_KEY   -> chave do provedor
 *   AI_BASE_URL  -> ex.: https://api.openai.com/v1
 *   AI_MODEL     -> ex.: gpt-4o-mini
 *
 * Nenhuma tela precisa mudar: o modelo usado vem de `modeloIA()`.
 */

const LOVABLE_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const MODELO_PADRAO_LOVABLE = "google/gemini-3.7-flash";

export function modeloIA(): string {
  return process.env["AI_MODEL"] || MODELO_PADRAO_LOVABLE;
}

/** Cria o provedor de IA a partir das variáveis de ambiente disponíveis. */
export function createAiProvider() {
  const externalKey = process.env["AI_API_KEY"];
  const externalBaseUrl = process.env["AI_BASE_URL"];

  if (externalKey) {
    return createOpenAICompatible({
      name: "ia",
      baseURL: externalBaseUrl || "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${externalKey}` },
    });
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) {
    throw new Error(
      "IA não configurada. Defina AI_API_KEY (e opcionalmente AI_BASE_URL / AI_MODEL) ou LOVABLE_API_KEY.",
    );
  }

  return createLovableAiGatewayProvider(lovableKey);
}

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: LOVABLE_BASE_URL,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
