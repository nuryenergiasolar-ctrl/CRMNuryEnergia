import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Kpi, Painel, PeriodoFiltro } from "@/components/ComercialUI";
import { NovoOrcamentoButton } from "@/components/NovoOrcamentoButton";

import { OrcamentoDialog } from "@/components/OrcamentoDialog";
import { OrcamentosTable } from "@/components/OrcamentosTable";
import { listarOrcamentos, previsaoComercial, type Orcamento } from "@/lib/orcamentos";
import { filtrarPorData, moeda, pct, type Periodo } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({
    meta: [
      { title: "Todos os Orçamentos | Nury Energia" },
      {
        name: "description",
        content:
          "Tabela completa de orçamentos com pesquisa e filtros por cliente, vendedor, responsável, prioridade e status.",
      },
      { property: "og:title", content: "Todos os Orçamentos | Nury Energia" },
      {
        property: "og:description",
        content: "Pesquise e filtre todos os pedidos de orçamento da Nury Energia.",
      },
    ],
  }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const [selecionado, setSelecionado] = useState<Orcamento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });
  const data = filtrarPorData(todos, periodo, "data_pedido");
  const prev = previsaoComercial(data);

  return (
    <AppShell
      title="Orçamentos"
      description="Todos os pedidos registrados, com pesquisa e filtros."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <NovoOrcamentoButton />
        </>
      }
    >
      <Painel
        titulo="Previsão de vendas e ciclo comercial"
        descricao="Baseado nos orçamentos em andamento e no histórico de fechamento"
        className="mb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi
            label="Valor em aberto"
            valor={moeda(prev.emAberto)}
            detalhe={`${prev.abertos} orçamento(s) em andamento`}
          />
          <Kpi
            label="Previsão de vendas"
            valor={moeda(prev.previsao)}
            detalhe="Em aberto × taxa de fechamento"
            destaque
          />
          <Kpi label="Taxa de fechamento" valor={pct(prev.taxaGanho * 100)} />
          <Kpi
            label="Ciclo comercial médio"
            valor={`${prev.cicloMedio.toFixed(1)} dias`}
            detalhe="Do pedido ao fechamento"
          />
          <Kpi
            label="Ticket médio fechado"
            valor={moeda(prev.ticketMedio)}
            detalhe={`${prev.fechados} fechado(s)`}
          />
        </div>
      </Painel>

      <OrcamentosTable
        orcamentos={data}
        onSelect={setSelecionado}
        empty={isLoading ? "Carregando..." : "Nenhum orçamento cadastrado ainda."}
      />
      <OrcamentoDialog
        orcamento={selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      />
    </AppShell>
  );
}
