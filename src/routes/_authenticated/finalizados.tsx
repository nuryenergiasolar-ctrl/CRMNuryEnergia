import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { OrcamentoDialog } from "@/components/OrcamentoDialog";
import { OrcamentosTable } from "@/components/OrcamentosTable";
import { STATUS_ENCERRADOS, listarOrcamentos, type Orcamento } from "@/lib/orcamentos";
import { PeriodoFiltro } from "@/components/ComercialUI";
import { filtrarPorData, type Periodo } from "@/lib/leads";


export const Route = createFileRoute("/_authenticated/finalizados")({
  head: () => ({
    meta: [
      { title: "Orçamentos Fechados | Nury Energia" },
      {
        name: "description",
        content:
          "Consulta do histórico de orçamentos fechados e cancelados, com datas de conclusão e alterações registradas.",
      },
      { property: "og:title", content: "Orçamentos Fechados | Nury Energia" },
      {
        property: "og:description",
        content: "Arquivo permanente dos orçamentos fechados da Nury Energia.",
      },
    ],
  }),
  component: FinalizadosPage,
});

function FinalizadosPage() {
  const [selecionado, setSelecionado] = useState<Orcamento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });
  const data = filtrarPorData(todos, periodo, "data_pedido");

  const finalizados = data
    .filter((o) => STATUS_ENCERRADOS.includes(o.status))
    .sort((a, b) => (b.data_conclusao ?? "").localeCompare(a.data_conclusao ?? ""));

  return (
    <AppShell
      title="Fechados"
      description="Histórico permanente para consulta. Nada é apagado do sistema."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      <OrcamentosTable
        orcamentos={finalizados}
        onSelect={setSelecionado}
        empty={isLoading ? "Carregando..." : "Nenhum orçamento fechado ainda."}
      />
      <OrcamentoDialog
        orcamento={selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      />
    </AppShell>
  );
}
