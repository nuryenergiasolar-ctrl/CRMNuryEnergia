import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, CheckCircle2, Circle, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Kpi, Painel, PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  arquivarFollowUp,
  concluirFollowUp,
  criarFollowUp,
  listarFollowUps,
  listarFollowUpsArquivados,
  listarLeads,
  listarVendedores,
  filtrarPorData,
  type Periodo,
} from "@/lib/leads";
import { useConfig } from "@/lib/config";
import { usePapel } from "@/lib/usePapel";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/followups")({
  head: () => ({
    meta: [
      { title: "Follow-ups | Nury Energia" },
      {
        name: "description",
        content:
          "Agenda de follow-ups comerciais da Nury Energia: contatos previstos, atrasados e concluídos.",
      },
      { property: "og:title", content: "Follow-ups | Nury Energia" },
      {
        property: "og:description",
        content: "Nenhum contato esquecido: agende e conclua os follow-ups dos leads.",
      },
    ],
  }),
  component: FollowUps,
});

const VAZIO = {
  lead_id: "",
  titulo: "",
  tipo: "WhatsApp",
  responsavel: "",
  data_prevista: "",
  observacoes: "",
};

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function FollowUps() {
  const [form, setForm] = useState(VAZIO);
  const [verArquivados, setVerArquivados] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();

  const { data: followUpsTodos = [], isLoading } = useQuery({
    queryKey: ["follow-ups"],
    queryFn: listarFollowUps,
  });
  const followUps = filtrarPorData(followUpsTodos, periodo, "data_prevista");
  const { data: arquivados = [] } = useQuery({
    queryKey: ["follow-ups-arquivados"],
    queryFn: listarFollowUpsArquivados,
  });
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: listarVendedores,
  });


  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error("Descreva a atividade do follow-up.");
      await criarFollowUp({
        lead_id: form.lead_id || null,
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        responsavel: form.responsavel || null,
        data_prevista: form.data_prevista
          ? new Date(form.data_prevista).toISOString()
          : new Date().toISOString(),
        observacoes: form.observacoes.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      setForm(VAZIO);
      toast.success("Follow-up agendado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const concluir = useMutation({
    mutationFn: (v: { id: string; concluido: boolean }) => concluirFollowUp(v.id, v.concluido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: (v: { id: string; arquivar: boolean }) => arquivarFollowUp(v.id, v.arquivar),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-arquivados"] });
      toast.success(v.arquivar ? "Follow-up arquivado." : "Follow-up restaurado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const agora = Date.now();
  const pendentes = followUps.filter((f) => !f.concluido);
  const atrasados = pendentes.filter((f) => new Date(f.data_prevista).getTime() < agora);
  const concluidos = followUps.filter((f) => f.concluido);
  const nomeLead = (id: string | null) => leads.find((l) => l.id === id)?.nome ?? null;

  return (
    <AppShell
      title="Follow-ups"
      description="Agenda de contatos para não perder nenhum lead."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Pendentes" valor={pendentes.length} />
          <Kpi label="Atrasados" valor={atrasados.length} destaque={atrasados.length > 0} />
          <Kpi label="Concluídos" valor={concluidos.length} />
        </div>

        {!podeEditar ? <SomenteLeitura /> : null}
        {podeEditar ? (
        <Painel titulo="Agendar follow-up">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Atividade *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lead</Label>
              <select
                className={selectClass}
                value={form.lead_id}
                onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
              >
                <option value="">Sem lead vinculado</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <select
                className={selectClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {config.followup_tipos.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Responsável</Label>
              <select
                className={selectClass}
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              >
                <option value="">Não definido</option>
                {vendedores.map((v) => (
                  <option key={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data prevista</Label>
              <Input
                type="datetime-local"
                value={form.data_prevista}
                onChange={(e) => setForm({ ...form, data_prevista: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea
                rows={1}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              <PlusCircle className="size-4" /> Agendar
            </Button>
          </div>
        </Painel>
        ) : null}

        <Painel titulo="Pendentes">
          {isLoading ? (
            <Vazio texto="Carregando follow-ups…" />
          ) : pendentes.length === 0 ? (
            <Vazio texto="Nenhum follow-up pendente." />
          ) : (
            <ul className="divide-y divide-border">
              {pendentes.map((f) => {
                const atrasado = new Date(f.data_prevista).getTime() < agora;
                return (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.tipo}
                        {nomeLead(f.lead_id) ? ` · ${nomeLead(f.lead_id)}` : ""}
                        {f.responsavel ? ` · ${f.responsavel}` : ""}
                        {" · "}
                        <span className={cn(atrasado && "font-semibold text-destructive")}>
                          {new Date(f.data_prevista).toLocaleString("pt-BR")}
                          {atrasado ? " (atrasado)" : ""}
                        </span>
                      </p>
                    </div>
                    {podeEditar ? (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => concluir.mutate({ id: f.id, concluido: true })}
                        >
                          <Circle className="size-4" /> Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => arquivar.mutate({ id: f.id, arquivar: true })}
                        >
                          <Archive className="size-4" /> Arquivar
                        </Button>
                      </div>
                    ) : null}

                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        <Painel titulo="Concluídos">
          {concluidos.length === 0 ? (
            <Vazio texto="Nenhum follow-up concluído ainda." />
          ) : (
            <ul className="divide-y divide-border">
              {concluidos.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {f.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nomeLead(f.lead_id) ?? "Sem lead"} ·{" "}
                      {f.concluido_em
                        ? new Date(f.concluido_em).toLocaleString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  {podeEditar ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => concluir.mutate({ id: f.id, concluido: false })}
                      >
                        <CheckCircle2 className="size-4" /> Reabrir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => arquivar.mutate({ id: f.id, arquivar: true })}
                      >
                        <Archive className="size-4" /> Arquivar
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel
          titulo={`Arquivados (${arquivados.length})`}
          acoes={
            <Button size="sm" variant="outline" onClick={() => setVerArquivados((v) => !v)}>
              {verArquivados ? "Ocultar" : "Mostrar"}
            </Button>
          }
        >
          {!verArquivados ? (
            <Vazio texto="Os follow-ups arquivados ficam guardados aqui e podem ser restaurados." />
          ) : arquivados.length === 0 ? (
            <Vazio texto="Nenhum follow-up arquivado." />
          ) : (
            <ul className="divide-y divide-border">
              {arquivados.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{f.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.tipo} · {nomeLead(f.lead_id) ?? "Sem lead"} ·{" "}
                      {f.arquivado_em
                        ? `arquivado em ${new Date(f.arquivado_em).toLocaleString("pt-BR")}`
                        : "—"}
                    </p>
                  </div>
                  {podeEditar ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => arquivar.mutate({ id: f.id, arquivar: false })}
                    >
                      <ArchiveRestore className="size-4" /> Restaurar
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Painel>

      </div>
    </AppShell>
  );
}
