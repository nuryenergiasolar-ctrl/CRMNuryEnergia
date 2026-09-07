import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { CORES_GRAFICO, Kpi, Painel, PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { LeadDialog } from "@/components/LeadDialog";
import { Button } from "@/components/ui/button";
import {
  ETAPAS_ABERTAS,
  ETAPA_COR,
  calcularIndicadores,
  diasSemContato,
  filtrarPorPeriodo,
  funil,
  leadsParados,
  listarLeads,
  moeda,
  motivosPerda,
  pct,
  porOrigem,
  porProduto,
  porVendedor,
  serieMensal,
  type Lead,
  type Periodo,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comercial")({
  head: () => ({
    meta: [
      { title: "Dashboard Comercial | Nury Energia" },
      {
        name: "description",
        content:
          "Pipeline comercial da Nury Energia: leads, propostas, vendas, faturamento, conversão e ranking de vendedores.",
      },
      { property: "og:title", content: "Dashboard Comercial | Nury Energia" },
      {
        property: "og:description",
        content: "Acompanhe o funil de vendas, origem dos leads e desempenho da equipe.",
      },
    ],
  }),
  component: DashboardComercial,
});

function DashboardComercial() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [lead, setLead] = useState<Lead | null>(null);
  const [aberto, setAberto] = useState(false);

  const { data: leads = [], isLoading } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const leadsPeriodo = filtrarPorPeriodo(leads, periodo);
  const ind = calcularIndicadores(leadsPeriodo, []);
  const dadosFunil = funil(leadsPeriodo);
  const origens = porOrigem(leadsPeriodo);
  const produtos = porProduto(leadsPeriodo).slice(0, 6);
  const ranking = porVendedor(leadsPeriodo);
  const perdas = motivosPerda(leadsPeriodo);
  const parados = leadsParados(leads);
  const serie = serieMensal(leads, 6);
  const abertosParados = leads
    .filter((l) => ETAPAS_ABERTAS.includes(l.etapa) && diasSemContato(l) > 3)
    .sort((a, b) => diasSemContato(b) - diasSemContato(a))
    .slice(0, 8);

  function novoLead() {
    setLead(null);
    setAberto(true);
  }

  return (
    <AppShell
      title="Dashboard Comercial"
      description="Pipeline de leads, vendas e desempenho da equipe."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <Button onClick={novoLead}>
            <PlusCircle className="size-4" /> Novo lead
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Vazio texto="Carregando dados comerciais…" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Leads recebidos" valor={ind.totalLeads} verDetalhes="funil" />
            <Kpi label="Qualificados" valor={ind.qualificados} verDetalhes="funil" />
            <Kpi label="Propostas" valor={ind.propostas} verDetalhes="funil" />
            <Kpi label="Vendas" valor={ind.vendas} verDetalhes="vendas" />
            <Kpi
              label="Faturamento"
              valor={moeda(ind.faturamento)}
              destaque
              verDetalhes="vendas"
            />
            <Kpi
              label="Conversão"
              valor={pct(ind.conversao)}
              detalhe={`Ticket médio ${moeda(ind.ticketMedio)}`}
              verDetalhes="conversao"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Painel titulo="Conversão por etapa do funil" verDetalhes="funil">
              <div className="space-y-2">
                {dadosFunil.map((e) => (
                  <div key={e.etapa}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{e.etapa}</span>
                      <span className="text-muted-foreground">
                        {e.quantidade} · {pct(e.percentual)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, e.percentual)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Painel>

            <Painel titulo="Origem dos leads" verDetalhes="origem">
              {origens.length === 0 ? (
                <Vazio texto="Nenhum lead no período." />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={origens}
                      dataKey="leads"
                      nameKey="origem"
                      innerRadius={45}
                      outerRadius={85}
                      label={(e: { origem: string; leads: number }) =>
                        `${e.origem}: ${e.leads}`
                      }
                    >
                      {origens.map((_, i) => (
                        <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Painel>

            <Painel titulo="Produtos mais vendidos" verDetalhes="produtos">
              {produtos.length === 0 ? (
                <Vazio texto="Sem vendas registradas." />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={produtos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="produto" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => moeda(v)} />
                    <Bar dataKey="faturamento" fill="var(--chart-1)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Painel>

            <Painel titulo="Desempenho por origem" verDetalhes="origem">
              {origens.length === 0 ? (
                <Vazio texto="Sem dados." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-1 text-left">Origem</th>
                      <th className="py-1 text-right">Leads</th>
                      <th className="py-1 text-right">Vendas</th>
                      <th className="py-1 text-right">Conv.</th>
                      <th className="py-1 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {origens.map((o) => (
                      <tr key={o.origem} className="border-t border-border">
                        <td className="py-1.5">{o.origem}</td>
                        <td className="py-1.5 text-right">{o.leads}</td>
                        <td className="py-1.5 text-right">{o.vendas}</td>
                        <td className="py-1.5 text-right">{pct(o.conversao)}</td>
                        <td className="py-1.5 text-right">{moeda(o.faturamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Painel>

            <Painel titulo="Ranking de vendedores" verDetalhes="ranking">
              {ranking.length === 0 ? (
                <Vazio texto="Sem dados." />
              ) : (
                <ol className="space-y-2">
                  {ranking.map((v, i) => (
                    <li
                      key={v.vendedor}
                      className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {i + 1}. {v.vendedor}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {v.vendas} vendas · {pct(v.conversao)} · {moeda(v.faturamento)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Painel>

            <Painel titulo="Motivos de perda" verDetalhes="perdas">
              {perdas.length === 0 ? (
                <Vazio texto="Nenhuma perda registrada." />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={perdas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="motivo"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="var(--chart-5)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Painel>

            <Painel titulo="Leads parados (sem contato)" verDetalhes="parados">
              <div className="mb-3 flex flex-wrap gap-2">
                {parados.map((p) => (
                  <span
                    key={p.dias}
                    className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    +{p.dias}d: <strong className="text-foreground">{p.quantidade}</strong>
                  </span>
                ))}
              </div>
              {abertosParados.length === 0 ? (
                <Vazio texto="Nenhum lead parado. Pipeline em dia!" />
              ) : (
                <ul className="space-y-1.5">
                  {abertosParados.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setLead(l);
                          setAberto(true);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{l.nome}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 font-semibold",
                              ETAPA_COR[l.etapa],
                            )}
                          >
                            {l.etapa}
                          </span>
                          {diasSemContato(l)}d
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Painel>

            <Painel
              titulo="Previsão de vendas e ciclo comercial"
              descricao="Baseado no valor em negociação e na taxa histórica de ganho."
              verDetalhes="previsao"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Kpi label="Em negociação" valor={moeda(ind.emNegociacao)} />
                <Kpi label="Previsão de fechamento" valor={moeda(ind.previsao)} destaque />
                <Kpi
                  label="Ciclo médio de venda"
                  valor={`${ind.cicloMedio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`}
                />
                <Kpi label="Taxa de ganho (propostas)" valor={pct(ind.taxaGanhoHistorica)} />
              </div>
            </Painel>

            <Painel
              titulo="Faturamento por mês"
              descricao="Últimos 6 meses"
              className="lg:col-span-2"
              verDetalhes="vendas"
            >
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => moeda(v)} />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Painel>
          </div>
        </div>
      )}

      <LeadDialog lead={lead} aberto={aberto} onOpenChange={setAberto} />
    </AppShell>
  );
}
