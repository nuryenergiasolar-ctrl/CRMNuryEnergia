import { atualizarLead, diasEntre, type Lead } from "@/lib/leads";

/** Etapas do pipeline/kanban, na ordem do funil. */
export const ETAPAS_PIPELINE = [
  "Novo lead",
  "Em atendimento",
  "Qualificado",
  "Proposta enviada",
  "Negociação",
  "Ganho",
  "Perdido",
] as const;

export type EtapaPipeline = (typeof ETAPAS_PIPELINE)[number];

export const ETAPA_LABEL: Record<EtapaPipeline, string> = {
  "Novo lead": "Novo Lead",
  "Em atendimento": "Em Atendimento",
  Qualificado: "Qualificado",
  "Proposta enviada": "Proposta Enviada",
  Negociação: "Negociação",
  Ganho: "Fechado",
  Perdido: "Perdido / Lead Frio",
};

/** Prazo máximo (em dias) que um lead pode ficar em "Em atendimento". */
export const PRAZO_ATENDIMENTO_DIAS = 4;

/** Dias desde o último movimento do lead (proxy da permanência na etapa). */
export function diasNaEtapa(lead: Lead): number {
  return diasEntre(lead.ultimo_contato ?? lead.data_entrada, null);
}

export function atendimentoExpirado(lead: Lead): boolean {
  return (
    lead.etapa === "Em atendimento" && diasNaEtapa(lead) >= PRAZO_ATENDIMENTO_DIAS
  );
}

/** Dias restantes antes do lead cair automaticamente para Perdido. */
export function diasRestantesAtendimento(lead: Lead): number {
  return Math.max(0, PRAZO_ATENDIMENTO_DIAS - diasNaEtapa(lead));
}

/**
 * Move automaticamente para Perdido (Lead Frio) os leads que completaram
 * o prazo em "Em atendimento" sem avanço. Os registros continuam salvos
 * para repescagem futura.
 */
export async function expirarAtendimentos(leads: Lead[]): Promise<number> {
  const expirados = leads.filter(atendimentoExpirado);
  for (const lead of expirados) {
    await atualizarLead(lead.id, {
      etapa: "Perdido",
      temperatura: "Frio",
      motivo_perda: lead.motivo_perda ?? "Não respondeu",
    });
  }
  return expirados.length;
}

/** Mover manualmente um lead entre etapas. */
export async function moverLead(lead: Lead, etapa: EtapaPipeline): Promise<void> {
  if (lead.etapa === etapa) return;
  await atualizarLead(lead.id, {
    etapa,
    ultimo_contato: new Date().toISOString(),
    ...(etapa === "Ganho"
      ? { data_fechamento: lead.data_fechamento ?? new Date().toISOString() }
      : {}),
    ...(etapa === "Perdido" ? { temperatura: "Frio" } : {}),
  });
}
