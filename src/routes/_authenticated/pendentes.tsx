import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { OrcamentoDialog } from "@/components/OrcamentoDialog";
import { OrcamentosTable } from "@/components/OrcamentosTable";
import { STATUS_ABERTOS, listarOrcamentos, type Orcamento } from "@/lib/orcamentos";
import { PeriodoFiltro } from "@/components/ComercialUI";
import { filtrarPorData, type Periodo } from "@/lib/leads";


export const Route = createFileRoute("/_authenticated/pendentes")({
  head: () => ({
    meta: [
      { title: "Pendentes de Ação | Nury Energia" },
      {
        name: "description",
        content:
          "Somente os orçamentos que precisam de ação: novos, em orçamento, aguardando informação e prontos para envio.",
      },
      { property: "og:title", content: "Pendentes de Ação | Nury Energia" },
      {
        property: "og:description",
        content: "Fila de trabalho com os orçamentos que ainda exigem ação da equipe.",
      },
    ],
  }),
  component: PendentesPage,
});

function PendentesPage() {
  const [selecionado, setSelecionado] = useState<Orcamento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });
  const data = filtrarPorData(todos, periodo, "data_pedido");

  const pendentes = data
    .filter((o) => STATUS_ABERTOS.includes(o.status))
    .sort((a, b) => {
      const peso = { Urgente: 0, Alta: 1, Normal: 2 } as Record<string, number>;
      const p = (peso[a.prioridade] ?? 3) - (peso[b.prioridade] ?? 3);
      if (p !== 0) return p;
      return (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999");
    });

  return (
    <AppShell
      title="Pendentes"
      description="Fila de trabalho: apenas orçamentos que precisam de ação, ordenados por prioridade e prazo."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      <OrcamentosTable
        orcamentos={pendentes}
        onSelect={setSelecionado}
        empty={isLoading ? "Carregando..." : "Nada pendente no momento."}
      />
      <OrcamentoDialog
        orcamento={selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      />
    </AppShell>
  );
}
