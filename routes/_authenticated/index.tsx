import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { NovoOrcamentoButton } from "@/components/NovoOrcamentoButton";
import { CaixaNotificacoes } from "@/components/CaixaNotificacoes";

import { AtrasoBadge, PrioridadeBadge, ProximoBadge, StatusBadge } from "@/components/Badges";
import { OrcamentoDialog } from "@/components/OrcamentoDialog";
import {
  STATUS_ABERTOS,
  diasAberto,
  diasParaPrazo,
  estaAtrasado,
  estaFechado,
  formatData,
  listarOrcamentos,
  prazoProximo,
  type Orcamento,
} from "@/lib/orcamentos";
import { PeriodoFiltro } from "@/components/ComercialUI";
import { filtrarPorData, type Periodo } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Orçamentos | Nury Energia" },
      {
        name: "description",
        content:
          "Painel de controle dos pedidos de orçamento da Nury Energia: pendentes, urgentes, atrasados e finalizados.",
      },
      { property: "og:title", content: "Dashboard de Orçamentos | Nury Energia" },
      {
        property: "og:description",
        content: "Acompanhe todos os pedidos de orçamento por status, prioridade e prazo.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [selecionado, setSelecionado] = useState<Orcamento | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const { data: todos = [], isLoading, error } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });
  const data = filtrarPorData(todos, periodo, "data_pedido");

  const count = (fn: (o: Orcamento) => boolean) => data.filter(fn).length;
  const urgentes = data.filter((o) => o.prioridade === "Urgente" && STATUS_ABERTOS.includes(o.status));
  const atrasados = data.filter(estaAtrasado);
  const prioridades = [...new Set([...urgentes, ...atrasados])].sort(
    (a, b) => (diasParaPrazo(a) ?? 999) - (diasParaPrazo(b) ?? 999),
  );

  const cards = [
    { label: "Total de orçamentos", value: data.length, tone: "" },
    { label: "Novos/Pendentes", value: count((o) => o.status === "Novo/Pendente"), tone: "info" },
    { label: "Em andamento", value: count((o) => o.status === "Em orçamento"), tone: "" },
    {
      label: "Aguardando informação",
      value: count((o) => o.status === "Aguardando informação"),
      tone: "alta",
    },
    { label: "Prontos", value: count((o) => o.status === "Pronto"), tone: "normal" },
    {
      label: "Enviados",
      value: count((o) => o.status === "Enviado ao vendedor"),
      tone: "info",
    },
    { label: "Fechados", value: count((o) => estaFechado(o.status)), tone: "" },
    { label: "Urgentes", value: urgentes.length, tone: "urgente" },
    { label: "Atrasados", value: atrasados.length, tone: "urgente" },
  ];

  return (
    <AppShell
      title="Dashboard"
      description="Visão geral de todos os pedidos de orçamento em andamento."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          <NovoOrcamentoButton />
        </>
      }
    >

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-urgente-soft p-3 text-sm text-urgente">
          Erro ao carregar dados: {(error as Error).message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-lg border border-border bg-card p-4 shadow-sm",
              c.tone === "urgente" && "border-urgente/30 bg-urgente-soft",
              c.tone === "alta" && "border-alta/25 bg-alta-soft",
              c.tone === "normal" && "border-normal/25 bg-normal-soft",
              c.tone === "info" && "border-info/25 bg-info-soft",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tabular-nums",
                c.tone === "urgente" && "text-urgente",
                c.tone === "alta" && "text-alta",
                c.tone === "normal" && "text-normal",
                c.tone === "info" && "text-info",
              )}
            >
              {isLoading ? "—" : c.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight">Lembretes e calendário</h2>
        <CaixaNotificacoes />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Prioridades</h2>
          <Link to="/pendentes" className="text-sm font-medium text-primary hover:underline">
            Ver pendentes →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card">
          {prioridades.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhum orçamento urgente ou atrasado. Tudo sob controle.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {prioridades.map((o) => {
                const dias = diasParaPrazo(o);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => setSelecionado(o)}
                      className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <span className="font-mono text-xs font-semibold">{o.numero}</span>
                      <span className="min-w-40 flex-1 font-medium">{o.cliente}</span>
                      <span className="text-sm text-muted-foreground">
                        {o.responsavel ?? "Sem responsável"}
                      </span>
                      <PrioridadeBadge value={o.prioridade} />
                      <StatusBadge value={o.status} />
                      <span className="text-sm text-muted-foreground">
                        Prazo {formatData(o.prazo)}
                      </span>
                      {estaAtrasado(o) && dias !== null ? (
                        <AtrasoBadge dias={dias} />
                      ) : prazoProximo(o) && dias !== null ? (
                        <ProximoBadge dias={dias} />
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {diasAberto(o)}d aberto
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <OrcamentoDialog
        orcamento={selecionado}
        onOpenChange={(open) => !open && setSelecionado(null)}
      />
    </AppShell>
  );
}
