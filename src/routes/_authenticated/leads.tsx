import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, PlusCircle } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadsTable } from "@/components/LeadsTable";
import { PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { Button } from "@/components/ui/button";
import { filtrarPorData, listarLeads, type Lead, type Periodo } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Gestão de Leads | Nury Energia" },
      {
        name: "description",
        content:
          "Cadastro e acompanhamento de leads da Nury Energia por origem, temperatura, etapa do funil e vendedor.",
      },
      { property: "og:title", content: "Gestão de Leads | Nury Energia" },
      {
        property: "og:description",
        content: "Todos os leads com histórico, valor estimado e motivo de perda.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [aberto, setAberto] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const { data: todos = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const leads = filtrarPorData(todos, periodo, "data_entrada");

  return (
    <AppShell
      title="Leads"
      description="Todos os leads ativos com histórico e etapa do funil."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <Button asChild variant="outline">
            <Link to="/leads-arquivados">
              <Archive className="size-4" /> Arquivados
            </Link>
          </Button>
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
        <Vazio texto="Carregando leads…" />
      ) : (
        <LeadsTable
          leads={leads}
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
