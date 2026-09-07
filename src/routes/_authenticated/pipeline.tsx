import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadKanban } from "@/components/LeadKanban";
import { PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { Button } from "@/components/ui/button";
import { filtrarPorData, listarLeads, type Lead, type Periodo } from "@/lib/leads";
import { expirarAtendimentos } from "@/lib/pipeline";
import { usePapel } from "@/lib/usePapel";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline de Leads | Nury Energia" },
      {
        name: "description",
        content:
          "Kanban comercial da Nury Energia: arraste os leads entre Novo Lead, Em Atendimento, Qualificado, Proposta Enviada, Negociação, Fechado e Perdido.",
      },
      { property: "og:title", content: "Pipeline de Leads | Nury Energia" },
      {
        property: "og:description",
        content: "Visualização Kanban do funil comercial com prazo automático de atendimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();
  const [lead, setLead] = useState<Lead | null>(null);
  const [aberto, setAberto] = useState(false);
  const jaExpirou = useRef(false);

  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: listarLeads,
  });
  const leadsPeriodo = filtrarPorData(leads, periodo, "data_entrada");

  useEffect(() => {
    if (!podeEditar || jaExpirou.current || leads.length === 0) return;
    jaExpirou.current = true;
    expirarAtendimentos(leads)
      .then((qtd) => {
        if (qtd > 0) {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          toast.info(
            `${qtd} lead(s) sem avanço em 4 dias foram movidos para Perdido / Lead Frio.`,
          );
        }
      })
      .catch(() => undefined);
  }, [leads, podeEditar, queryClient]);

  return (
    <AppShell
      title="Pipeline de leads"
      description="Kanban do funil comercial — arraste os cartões para mudar de etapa."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <Button
          onClick={() => {
            setLead(null);
            setAberto(true);
          }}
        >
          <PlusCircle className="size-4" /> Novo lead
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Vazio texto="Carregando pipeline…" />
      ) : (
        <LeadKanban
          leads={leadsPeriodo}
          onSelecionar={(l) => {
            setLead(l);
            setAberto(true);
          }}
        />
      )}
      <LeadDialog lead={lead} aberto={aberto} onOpenChange={setAberto} />
    </AppShell>
  );
}
