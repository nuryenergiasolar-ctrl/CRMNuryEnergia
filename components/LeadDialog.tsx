import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Copy, FilePlus, MessageCircle, Save } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ETAPAS,
  TEMPERATURAS,
  arquivarLead,
  atualizarLead,
  criarFollowUp,
  criarLead,
  diasEntre,
  faixaTicket,
  historicoLead,
  linkWhatsApp,
  listarProdutos,
  listarVendedores,
  moeda,
  restaurarLead,
  type Lead,
} from "@/lib/leads";
import { cn } from "@/lib/utils";
import { useConfig } from "@/lib/config";
import { usePapel } from "@/lib/usePapel";
import { SomenteLeitura } from "@/components/SomenteLeitura";

type Form = {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  endereco: string;
  origem: string;
  tipo: string;
  temperatura: string;
  produto: string;
  vendedor: string;
  etapa: string;
  valor: string;
  campanha: string;
  motivo_perda: string;
  observacoes: string;
};

const VAZIO: Form = {
  nome: "",
  telefone: "",
  email: "",
  cidade: "",
  endereco: "",
  origem: "WhatsApp",
  tipo: "Residencial",
  temperatura: "Morno",
  produto: "",
  vendedor: "",
  etapa: "Novo lead",
  valor: "",
  campanha: "",
  motivo_perda: "",
  observacoes: "",
};

function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm";

export function LeadDialog({
  lead,
  aberto,
  onOpenChange,
}: {
  lead: Lead | null;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { config } = useConfig();
  const [form, setForm] = useState<Form>(VAZIO);
  const [followUp, setFollowUp] = useState({ titulo: "", data: "" });
  const { podeEditar } = usePapel();
  const navigate = useNavigate();

  const { data: produtos = [] } = useQuery({ queryKey: ["produtos"], queryFn: listarProdutos });
  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: listarVendedores,
  });
  const { data: historico = [] } = useQuery({
    queryKey: ["lead-historico", lead?.id],
    queryFn: () => historicoLead(lead!.id),
    enabled: Boolean(lead?.id) && aberto,
  });

  useEffect(() => {
    if (!aberto) return;
    setForm(
      lead
        ? {
            nome: lead.nome ?? "",
            telefone: lead.telefone ?? "",
            email: lead.email ?? "",
            cidade: lead.cidade ?? "",
            endereco: lead.endereco ?? "",
            origem: lead.origem,
            tipo: lead.tipo,
            temperatura: lead.temperatura,
            produto: lead.produto ?? "",
            vendedor: lead.vendedor ?? "",
            etapa: lead.etapa,
            valor: lead.valor ? String(lead.valor) : "",
            campanha: lead.campanha ?? "",
            motivo_perda: lead.motivo_perda ?? "",
            observacoes: lead.observacoes ?? "",
          }
        : VAZIO,
    );
    setFollowUp({ titulo: "", data: "" });
  }, [lead, aberto]);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-arquivados"] });
    queryClient.invalidateQueries({ queryKey: ["lead-historico"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do lead.");
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        cidade: form.cidade.trim() || null,
        endereco: form.endereco.trim() || null,
        origem: form.origem,
        tipo: form.tipo,
        temperatura: form.temperatura,
        produto: form.produto || null,
        vendedor: form.vendedor || null,
        etapa: form.etapa,
        valor: form.valor ? Number(form.valor) : null,
        campanha: form.campanha.trim() || null,
        motivo_perda: form.etapa === "Perdido" ? form.motivo_perda || null : null,
        observacoes: form.observacoes.trim() || null,
        data_fechamento:
          form.etapa === "Ganho"
            ? (lead?.data_fechamento ?? new Date().toISOString())
            : null,
        ultimo_contato: new Date().toISOString(),
      };
      if (lead) await atualizarLead(lead.id, payload);
      else await criarLead(payload);

      if (followUp.titulo.trim()) {
        await criarFollowUp({
          lead_id: lead?.id ?? null,
          titulo: followUp.titulo.trim(),
          responsavel: form.vendedor || null,
          data_prevista: followUp.data
            ? new Date(followUp.data).toISOString()
            : new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      invalidar();
      toast.success(lead ? "Lead atualizado." : "Lead cadastrado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivar = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      if (lead.arquivado_em) await restaurarLead(lead.id);
      else await arquivarLead(lead.id);
    },
    onSuccess: () => {
      invalidar();
      toast.success(lead?.arquivado_em ? "Lead restaurado." : "Lead arquivado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const wa = linkWhatsApp(form.telefone);

  function criarOrcamentoDoLead() {
    const TIPO_ORC: Record<string, string> = {
      "Carregador Veicular": "Carregador Veicular",
      "Usina de Investimento": "Usina de Investimento",
      BESS: "BESS",
      Residencial: "Solar",
      Comercial: "Solar",
    };
    onOpenChange(false);
    navigate({
      to: "/novo",
      search: {
        cliente: form.nome || undefined,
        telefone: form.telefone || undefined,
        endereco: form.endereco || undefined,
        vendedor: form.vendedor || undefined,
        tipo: TIPO_ORC[form.tipo] ?? "Outros",
        valor: form.valor || undefined,
      },
    });
  }

  function copiarLead() {
    const linhas = [
      `Nome: ${form.nome}`,
      `Telefone: ${form.telefone || "—"}`,
      `Endereço: ${form.endereco || "—"}`,
      `Tipo: ${form.tipo}`,
      `Vendedor: ${form.vendedor || "—"}`,
    ];
    navigator.clipboard
      .writeText(linhas.join("\n"))
      .then(() => toast.success("Dados do lead copiados!"))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? form.nome || "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>
            {lead
              ? `Entrada em ${new Date(lead.data_entrada).toLocaleDateString("pt-BR")} · ${diasEntre(lead.data_entrada, null)} dias no pipeline`
              : "Cadastre o lead e acompanhe pelo funil comercial."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Nome *" className="sm:col-span-2">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <Campo label="Telefone">
            <div className="flex gap-1">
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
              {wa ? (
                <Button asChild variant="outline" size="icon" title="Abrir WhatsApp">
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </Campo>
          <Campo label="E-mail">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Campo>
          <Campo label="Cidade">
            <Input
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
          </Campo>
          <Campo label="Endereço" className="sm:col-span-2 lg:col-span-3">
            <Input
              placeholder="Rua, número, bairro, CEP"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </Campo>
          <Campo label="Origem">
            <select
              className={selectClass}
              value={form.origem}
              onChange={(e) => setForm({ ...form, origem: e.target.value })}
            >
              {config.lead_origens.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Tipo de cliente">
            <select
              className={selectClass}
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              {config.lead_tipos.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Temperatura">
            <select
              className={selectClass}
              value={form.temperatura}
              onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
            >
              {TEMPERATURAS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Produto de interesse">
            <select
              className={selectClass}
              value={form.produto}
              onChange={(e) => setForm({ ...form, produto: e.target.value })}
            >
              <option value="">Não informado</option>
              {produtos.map((p) => (
                <option key={p.id}>{p.nome}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Vendedor">
            <select
              className={selectClass}
              value={form.vendedor}
              onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
            >
              <option value="">Sem vendedor</option>
              {vendedores.map((v) => (
                <option key={v.id}>{v.nome}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Etapa do funil">
            <select
              className={selectClass}
              value={form.etapa}
              onChange={(e) => setForm({ ...form, etapa: e.target.value })}
            >
              {ETAPAS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Valor estimado (R$)">
            <Input
              type="number"
              min="0"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Faixa: {faixaTicket(form.valor ? Number(form.valor) : null)}
              {form.valor ? ` · ${moeda(Number(form.valor))}` : ""}
            </p>
          </Campo>
          <Campo label="Campanha / anúncio">
            <Input
              value={form.campanha}
              onChange={(e) => setForm({ ...form, campanha: e.target.value })}
            />
          </Campo>
          {form.etapa === "Perdido" ? (
            <Campo label="Motivo da perda">
              <select
                className={selectClass}
                value={form.motivo_perda}
                onChange={(e) => setForm({ ...form, motivo_perda: e.target.value })}
              >
                <option value="">Selecione</option>
                {config.lead_motivos_perda.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Campo>
          ) : null}
          <Campo label="Observações" className="sm:col-span-2 lg:col-span-3">
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </Campo>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-2">
          <Campo label="Agendar follow-up (opcional)">
            <Input
              placeholder="Ex.: Ligar para confirmar visita"
              value={followUp.titulo}
              onChange={(e) => setFollowUp({ ...followUp, titulo: e.target.value })}
            />
          </Campo>
          <Campo label="Data do follow-up">
            <Input
              type="datetime-local"
              value={followUp.data}
              onChange={(e) => setFollowUp({ ...followUp, data: e.target.value })}
            />
          </Campo>
        </div>

        {lead ? (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Histórico
            </p>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>
            ) : (
              <ul className="max-h-44 space-y-1.5 overflow-y-auto text-xs">
                {historico.map((h) => (
                  <li key={h.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </span>
                    <span>{h.campo}:</span>
                    <span>
                      {h.valor_anterior ? `${h.valor_anterior} → ` : ""}
                      {h.valor_novo ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {!podeEditar ? <SomenteLeitura /> : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {lead && podeEditar ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => arquivar.mutate()}
                disabled={arquivar.isPending}
              >
                {lead.arquivado_em ? (
                  <>
                    <ArchiveRestore className="size-4" /> Restaurar
                  </>
                ) : (
                  <>
                    <Archive className="size-4" /> Arquivar
                  </>
                )}
              </Button>
            ) : null}
            {lead ? (
              <Button type="button" variant="outline" onClick={copiarLead}>
                <Copy className="size-4" /> Copiar dados
              </Button>
            ) : null}
            {lead ? (
              <Button type="button" variant="secondary" onClick={criarOrcamentoDoLead}>
                <FilePlus className="size-4" /> Criar orçamento
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {podeEditar ? (
              <Button type="button" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                <Save className="size-4" /> Salvar
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
