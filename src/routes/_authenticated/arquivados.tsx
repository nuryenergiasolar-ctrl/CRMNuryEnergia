import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { OrcamentoDialog } from "@/components/OrcamentoDialog";
import { OrcamentosTable } from "@/components/OrcamentosTable";
import { listarArquivados, type Orcamento } from "@/lib/orcamentos";
import { PeriodoFiltro } from "@/components/ComercialUI";
import { filtrarPorData, type Periodo } from "@/lib/leads";


export const Route = createFileRoute("/_authenticated/arquivados")({
  head: () => ({
    meta: [
      { title: "Orçamentos Arquivados | Nury Energia" },
      {
        name: "description",
        content:
          "Área de orçamentos arquivados (excluídos) da Nury Energia: consulte os dados e o histórico completo e restaure quando necessário.",
      },
      { property: "og:title", content: "Orçamentos Arquivados | Nury Energia" },
      {
        property: "og:description",
        content: "Consulte e restaure orçamentos arquivados sem perder dados ou histórico.",
      },
    ],
  }),
  component: ArquivadosPage,
});

function ArquivadosPage() {
  const [selecionado, setSelecionado] = useState<Orcamento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["arquivados"],
    queryFn: listarArquivados,
  });
  const data = filtrarPorData(todos, periodo, "data_pedido");

  return (
    <AppShell
      title="Arquivados"
      description="Orçamentos excluídos ficam aqui com todos os dados e o histórico. Abra um registro para restaurá-lo."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      <OrcamentosTable
        orcamentos={data}
        onSelect={setSelecionado}
        empty={isLoading ? "Carregando..." : "Nenhum orçamento arquivado."}
      />
      <OrcamentoDialog
        orcamento={selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      />
    </AppShell>
  );
}
