import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlarmClock, MessageCircle, Snowflake } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SomenteLeitura } from "@/components/SomenteLeitura";
import {
  TEMPERATURA_ICON,
  linkWhatsApp,
  moeda,
  type Lead,
} from "@/lib/leads";
import {
  ETAPAS_PIPELINE,
  PRAZO_ATENDIMENTO_DIAS,
  atendimentoExpirado,
  diasNaEtapa,
  diasRestantesAtendimento,
  moverLead,
  type EtapaPipeline,
} from "@/lib/pipeline";
import { useConfig } from "@/lib/config";
import { usePapel } from "@/lib/usePapel";
import { cn } from "@/lib/utils";

const COLUNA_COR: Record<EtapaPipeline, string> = {
  "Novo lead": "border-t-sky-500",
  "Em atendimento": "border-t-blue-500",
  Qualificado: "border-t-violet-500",
  "Proposta enviada": "border-t-amber-500",
  Negociação: "border-t-orange-500",
  Ganho: "border-t-emerald-500",
  Perdido: "border-t-rose-500",
};

export function LeadKanban({
  leads,
  onSelecionar,
}: {
  leads: Lead[];
  onSelecionar: (lead: Lead) => void;
}) {
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();
  const { config } = useConfig();
  const rotulo = (etapa: string) => config.pipeline_labels[etapa] ?? etapa;
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<EtapaPipeline | null>(null);

  const mover = useMutation({
    mutationFn: ({ lead, etapa }: { lead: Lead; etapa: EtapaPipeline }) =>
      moverLead(lead, etapa),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-historico"] });
      toast.success(`Lead movido para ${rotulo(v.etapa)}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function soltar(etapa: EtapaPipeline) {
    const id = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.etapa === etapa) return;
    if (!podeEditar) {
      toast.error("Somente administradores podem mover leads.");
      return;
    }
    mover.mutate({ lead, etapa });
  }

  return (
    <div className="space-y-3">
      {!podeEditar ? <SomenteLeitura /> : null}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {ETAPAS_PIPELINE.map((etapa) => {
          const itens = leads.filter((l) => l.etapa === etapa);
          const total = itens.reduce((s, l) => s + (l.valor ?? 0), 0);
          return (
            <section
              key={etapa}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(etapa);
              }}
              onDragLeave={() => setAlvo((a) => (a === etapa ? null : a))}
              onDrop={() => soltar(etapa)}
              className={cn(
                "flex min-h-[60vh] w-[260px] shrink-0 flex-col rounded-xl border border-t-4 border-border bg-muted/30 p-2 transition-colors",
                COLUNA_COR[etapa],
                alvo === etapa && "bg-primary/10 ring-2 ring-primary/40",
              )}
            >
              <header className="px-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    {rotulo(etapa)}
                  </h3>
                  <span className="rounded-md bg-card px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {itens.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {total > 0 ? moeda(total) : "—"}
                </p>
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {itens.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                    Arraste leads para cá
                  </p>
                ) : (
                  itens.map((lead) => {
                    const wa = linkWhatsApp(lead.telefone);
                    const expirado = atendimentoExpirado(lead);
                    return (
                      <article
                        key={lead.id}
                        draggable={podeEditar}
                        onDragStart={() => setArrastando(lead.id)}
                        onDragEnd={() => setArrastando(null)}
                        onClick={() => onSelecionar(lead)}
                        className={cn(
                          "cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-sm transition hover:border-primary/50 hover:shadow",
                          arrastando === lead.id && "opacity-50",
                          expirado && "border-rose-500/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight text-foreground">
                            {lead.nome}
                          </p>
                          <span aria-hidden title={lead.temperatura}>
                            {TEMPERATURA_ICON[lead.temperatura]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {lead.tipo}
                          {lead.vendedor ? ` · ${lead.vendedor}` : ""}
                        </p>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          {lead.valor ? moeda(lead.valor) : "Sem valor"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {diasNaEtapa(lead)}d na etapa
                          </span>
                          {etapa === "Em atendimento" ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                diasRestantesAtendimento(lead) <= 1
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                              )}
                            >
                              <AlarmClock className="size-3" />
                              {diasRestantesAtendimento(lead)}d p/ prazo
                            </span>
                          ) : null}
                          {etapa === "Perdido" && lead.temperatura === "Frio" ? (
                            <span className="flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                              <Snowflake className="size-3" /> Lead Frio
                            </span>
                          ) : null}
                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300"
                            >
                              <MessageCircle className="size-3" /> WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Leads em <strong>Em Atendimento</strong> por {PRAZO_ATENDIMENTO_DIAS} dias sem avanço
        são movidos automaticamente para Perdido e marcados como Lead Frio — os dados
        continuam salvos para repescagem.
      </p>
    </div>
  );
}
