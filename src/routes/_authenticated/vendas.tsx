import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Kpi, Painel, PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { LeadDialog } from "@/components/LeadDialog";
import { LeadsTable } from "@/components/LeadsTable";
import {
  calcularIndicadores,
  filtrarPorPeriodo,
  listarLeads,
  moeda,
  pct,
  porVendedor,
  type Lead,
  type Periodo,
} from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas Fechadas | Nury Energia" },
      {
        name: "description",
        content:
          "Vendas fechadas da Nury Energia com faturamento, ticket médio e desempenho por vendedor.",
      },
      { property: "og:title", content: "Vendas Fechadas | Nury Energia" },
      {
        property: "og:description",
        content: "Acompanhe as vendas ganhas e o faturamento por período.",
      },
    ],
  }),
  component: Vendas,
});

function Vendas() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [lead, setLead] = useState<Lead | null>(null);
  const [aberto, setAberto] = useState(false);
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });

  const base = filtrarPorPeriodo(leads, periodo);
  const ganhos = base.filter((l) => l.etapa === "Ganho");
  const ind = calcularIndicadores(base, []);

  return (
    <AppShell
      title="Vendas"
      description="Negócios ganhos, faturamento e ticket médio."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      {isLoading ? (
        <Vazio texto="Carregando vendas…" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Vendas fechadas" valor={ganhos.length} />
            <Kpi label="Faturamento" valor={moeda(ind.faturamento)} destaque />
            <Kpi label="Ticket médio" valor={moeda(ind.ticketMedio)} />
            <Kpi label="Conversão" valor={pct(ind.conversao)} />
          </div>

          <Painel titulo="Faturamento por vendedor">
            {porVendedor(ganhos).length === 0 ? (
              <Vazio texto="Nenhuma venda no período." />
            ) : (
              <ul className="space-y-2">
                {porVendedor(ganhos).map((v) => (
                  <li
                    key={v.vendedor}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{v.vendedor}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.vendas} vendas · {moeda(v.faturamento)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Painel>

          <LeadsTable
            ocultarTemperatura
            leads={ganhos}
            onSelecionar={(l) => {
              setLead(l);
              setAberto(true);
            }}
          />
        </div>
      )}
      <LeadDialog lead={lead} aberto={aberto} onOpenChange={setAberto} />
    </AppShell>
  );
}
