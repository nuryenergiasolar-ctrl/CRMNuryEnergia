import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadsTable } from "@/components/LeadsTable";
import { PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { Button } from "@/components/ui/button";
import { filtrarPorData, listarLeadsArquivados, type Lead, type Periodo } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/leads-arquivados")({
  head: () => ({
    meta: [
      { title: "Leads Arquivados | Nury Energia" },
      {
        name: "description",
        content:
          "Leads arquivados da Nury Energia — dados e histórico preservados, com possibilidade de restauração.",
      },
      { property: "og:title", content: "Leads Arquivados | Nury Energia" },
      {
        property: "og:description",
        content: "Nenhum lead é apagado: consulte e restaure leads arquivados.",
      },
    ],
  }),
  component: LeadsArquivados,
});

function LeadsArquivados() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [aberto, setAberto] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["leads-arquivados"],
    queryFn: listarLeadsArquivados,
  });
  const leads = filtrarPorData(todos, periodo, "data_entrada");

  return (
    <AppShell
      title="Leads arquivados"
      description="Nenhum lead é apagado definitivamente. Abra o lead para restaurá-lo."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <Button asChild variant="outline">
          <Link to="/leads">
            <ArrowLeft className="size-4" /> Voltar aos leads
          </Link>
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Vazio texto="Carregando arquivados…" />
      ) : (
        <LeadsTable
          leads={leads}
          arquivados
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
