import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const Input = z.object({
  tela: z.string(),
  resumo: z.string(),
});

export const obterConselho = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const { createAiProvider, modeloIA } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider();

    const result = streamText({
      model: gateway(modeloIA()),
      instructions:
        "Você é o assistente operacional da Nury Energia, empresa de energia solar, carregadores veiculares, BESS e usinas de investimento. " +
        "Você orienta a equipe interna que controla pedidos de orçamento. " +
        "Responda SEMPRE em português do Brasil, direto e prático, em no máximo 6 linhas: " +
        "primeiro o próximo passo mais importante agora, depois 2 ou 3 ações complementares em lista curta. " +
        "Baseie-se apenas nos dados fornecidos. Não use markdown de títulos, use frases curtas e '-' para listas.",
      prompt: `Tela atual: ${data.tela}\n\nSituação atual do sistema:\n${data.resumo}\n\nQual é o próximo passo operacional?`,
    });

    return { texto: await result.text };
  });
