import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageCircle,
  PlusCircle,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CobrancaFormDialog } from "@/components/CobrancaFormDialog";
import { PeriodoFiltro } from "@/components/ComercialUI";
import { filtrarPorData, type Periodo } from "@/lib/leads";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePapel } from "@/lib/usePapel";
import {
  abrirWhatsappCobranca,
  diaISO,
  excluirCobranca,
  formatarDia,
  gradeDoMes,
  listarCobrancas,
  marcarPago,
  moeda,
  situacao,
  SITUACAO_CLASSE,
  SITUACAO_LABEL,
  totais,
  type Cobranca,
} from "@/lib/cobrancas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cobrancas")({
  head: () => ({
    meta: [
      { title: "Agenda de Cobranças | Nury Energia" },
      {
        name: "description",
        content:
          "Agenda mensal de cobranças e parcelas dos clientes da Nury Energia, com vencimentos, atrasos e dados completos do cliente.",
      },
      { property: "og:title", content: "Agenda de Cobranças | Nury Energia" },
      {
        property: "og:description",
        content: "Calendário de parcelas a receber com cobrança direta pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CobrancasPage,
});

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Kpi({
  label,
  valor,
  detalhe,
  classe,
}: {
  label: string;
  valor: string;
  detalhe?: string;
  classe?: string | undefined;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", classe)}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
      {detalhe ? <p className="text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function CobrancasPage() {
  const { podeEditar } = usePapel();
  const queryClient = useQueryClient();
  const hoje = new Date();
  const [ref, setRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [selecionada, setSelecionada] = useState<Cobranca | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("tudo");

  const { data: cobrancasTodas = [], isLoading } = useQuery({
    queryKey: ["cobrancas"],
    queryFn: listarCobrancas,
  });
  const cobrancas = filtrarPorData(cobrancasTodas, periodo, "vencimento");

  const porDia = useMemo(() => {
    const mapa = new Map<string, Cobranca[]>();
    for (const c of cobrancas) {
      const lista = mapa.get(c.vencimento) ?? [];
      lista.push(c);
      mapa.set(c.vencimento, lista);
    }
    return mapa;
  }, [cobrancas]);

  const semanas = gradeDoMes(ref.getFullYear(), ref.getMonth());
  const doMes = cobrancas.filter((c) => {
    const d = new Date(`${c.vencimento}T12:00:00`);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  });
  const t = totais(cobrancas);
  const tMes = totais(doMes);

  async function alternarPago(c: Cobranca, pago: boolean) {
    try {
      await marcarPago(c, pago);
      await queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      setSelecionada(null);
      toast.success(pago ? "Parcela marcada como paga." : "Pagamento desfeito.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    }
  }

  async function remover(c: Cobranca) {
    try {
      await excluirCobranca(c.id);
      await queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      setSelecionada(null);
      toast.success("Parcela removida.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível remover.");
    }
  }

  return (
    <AppShell
      title="Cobranças"
      description="Agenda de parcelas a receber dos clientes, com todos os dados para cobrar."
      actions={
        <>
          <PeriodoFiltro valor={periodo} onChange={setPeriodo} />
          {podeEditar ? (
          <CobrancaFormDialog
            gatilho={
              <Button size="lg">
                <PlusCircle className="size-4" /> Nova cobrança
              </Button>
            }
          />
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        {podeEditar ? null : <SomenteLeitura />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="A receber (total)"
            valor={moeda(t.aReceber)}
            detalhe={`${t.qtdAbertas} parcela(s) em aberto`}
          />
          <Kpi
            label="Em atraso"
            valor={moeda(t.atrasado)}
            detalhe={`${t.qtdAtrasadas} parcela(s) vencida(s)`}
            classe={t.qtdAtrasadas > 0 ? "border-urgente/50 bg-urgente-soft" : undefined}
          />
          <Kpi label="Recebido (total)" valor={moeda(t.recebido)} />
          <Kpi
            label="Neste mês"
            valor={moeda(tMes.aReceber)}
            detalhe={`${moeda(tMes.recebido)} já recebido`}
          />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold capitalize">
              <CalendarDays className="size-5" />
              {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-2">
              <div className="mr-2 hidden flex-wrap items-center gap-2 text-[11px] sm:flex">
                {(["atrasado", "proximo", "aberto", "pago"] as const).map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-semibold",
                      SITUACAO_CLASSE[s],
                    )}
                  >
                    {SITUACAO_LABEL[s]}
                  </span>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {DIAS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {semanas.flat().map((dia) => {
              const iso = diaISO(dia);
              const itens = porDia.get(iso) ?? [];
              const foraDoMes = dia.getMonth() !== ref.getMonth();
              const ehHoje = iso === diaISO(hoje);
              return (
                <div
                  key={iso}
                  className={cn(
                    "min-h-[130px] border-b border-r border-border p-1.5 align-top",
                    foraDoMes && "bg-muted/30 text-muted-foreground/60",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                        ehHoje && "bg-primary text-primary-foreground",
                      )}
                    >
                      {dia.getDate()}
                    </span>
                    {itens.length > 0 ? (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {moeda(itens.reduce((s, c) => s + c.valor, 0))}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {itens.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelecionada(c)}
                        className={cn(
                          "w-full rounded border px-1.5 py-1 text-left text-[11px] leading-tight transition-opacity hover:opacity-80",
                          SITUACAO_CLASSE[situacao(c)],
                        )}
                      >
                        <span className="block truncate font-bold">{c.cliente}</span>
                        <span className="block truncate">
                          {moeda(c.valor)} · {c.parcela}/{c.total_parcelas}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <p className="border-b border-border px-4 py-2.5 text-sm font-bold uppercase tracking-wide">
            Parcelas do mês ({doMes.length})
          </p>
          {isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Carregando cobranças…</p>
          ) : doMes.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Nenhuma parcela com vencimento neste mês.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {doMes.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      SITUACAO_CLASSE[situacao(c)],
                    )}
                  >
                    {SITUACAO_LABEL[situacao(c)]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatarDia(c.vencimento)}
                  </span>
                  <button
                    type="button"
                    className="flex-1 text-left text-sm font-semibold hover:underline"
                    onClick={() => setSelecionada(c)}
                  >
                    {c.cliente}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {c.telefone ?? "sem telefone"} · parcela {c.parcela}/
                      {c.total_parcelas}
                    </span>
                  </button>
                  <span className="text-sm font-bold tabular-nums">{moeda(c.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!selecionada} onOpenChange={(o) => !o && setSelecionada(null)}>
        <DialogContent className="sm:max-w-lg">
          {selecionada ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="size-4" /> {selecionada.cliente}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2 text-sm">
                <span
                  className={cn(
                    "inline-block rounded border px-2 py-0.5 text-xs font-bold uppercase",
                    SITUACAO_CLASSE[situacao(selecionada)],
                  )}
                >
                  {SITUACAO_LABEL[situacao(selecionada)]}
                </span>
                <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3">
                  {[
                    ["Valor da parcela", moeda(selecionada.valor)],
                    [
                      "Parcela",
                      `${selecionada.parcela} de ${selecionada.total_parcelas}`,
                    ],
                    ["Vencimento", formatarDia(selecionada.vencimento)],
                    ["Forma de pagamento", selecionada.forma_pagamento ?? "—"],
                    ["Telefone", selecionada.telefone ?? "—"],
                    ["Vendedor", selecionada.vendedor ?? "—"],
                    ["Tipo", selecionada.tipo ?? "—"],
                    [
                      "Pago em",
                      selecionada.pago_em
                        ? new Date(selecionada.pago_em).toLocaleString("pt-BR")
                        : "—",
                    ],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase text-muted-foreground">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <dt className="text-[11px] uppercase text-muted-foreground">
                      Endereço
                    </dt>
                    <dd className="font-semibold">{selecionada.endereco ?? "—"}</dd>
                  </div>
                  {selecionada.descricao ? (
                    <div className="col-span-2">
                      <dt className="text-[11px] uppercase text-muted-foreground">
                        Descrição
                      </dt>
                      <dd className="font-semibold">{selecionada.descricao}</dd>
                    </div>
                  ) : null}
                  {selecionada.observacoes ? (
                    <div className="col-span-2">
                      <dt className="text-[11px] uppercase text-muted-foreground">
                        Observações
                      </dt>
                      <dd>{selecionada.observacoes}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      abrirWhatsappCobranca(selecionada);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Erro ao abrir.");
                    }
                  }}
                >
                  <MessageCircle className="size-4" /> Cobrar no WhatsApp
                </Button>
                {podeEditar ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => remover(selecionada)}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" /> Remover
                    </Button>
                    {selecionada.pago ? (
                      <Button
                        variant="outline"
                        onClick={() => alternarPago(selecionada, false)}
                      >
                        <Undo2 className="size-4" /> Desfazer pagamento
                      </Button>
                    ) : (
                      <Button onClick={() => alternarPago(selecionada, true)}>
                        <Check className="size-4" /> Marcar como pago
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
