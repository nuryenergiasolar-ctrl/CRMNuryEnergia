import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  FileArchive,
  Paperclip,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { useConfig } from "@/lib/config";
import { usePapel } from "@/lib/usePapel";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PrioridadeBadge, StatusBadge } from "@/components/Badges";
import { Confetes } from "@/components/Confetes";
import {
  PRIORIDADES,
  STATUS,
  arquivarOrcamento,
  abrirTodosAnexos,
  atualizarOrcamento,
  baixarZipAnexos,
  exportarZipWhatsapp,
  copiarResumo,
  diasAberto,
  estaFechado,
  registrarVendaFechada,
  resumoOrcamento,
  enviarAnexos,
  formatData,
  linksAnexos,
  listarHistorico,
  restaurarOrcamento,
  type Anexo,
  type Orcamento,
} from "@/lib/orcamentos";

export function OrcamentoDialog({
  orcamento,
  onOpenChange,
}: {
  orcamento: Orcamento | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { podeEditar } = usePapel();
  const { config } = useConfig();
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [confetes, setConfetes] = useState(false);
  const [zipando, setZipando] = useState(false);
  const [zapNumero, setZapNumero] = useState("");

  useEffect(() => {
    if (!orcamento) return;
    setFiles([]);
    setForm({
      cliente: orcamento.cliente,
      telefone: orcamento.telefone ?? "",
      endereco: orcamento.endereco ?? "",
      vendedor: orcamento.vendedor,
      tipo: orcamento.tipo,
      valor: orcamento.valor?.toString() ?? "",
      status: orcamento.status,
      prioridade: orcamento.prioridade,
      responsavel: orcamento.responsavel ?? "",
      prazo: orcamento.prazo ?? "",
      observacoes: orcamento.observacoes ?? "",
    });
  }, [orcamento]);

  const historico = useQuery({
    queryKey: ["historico", orcamento?.id],
    queryFn: () => listarHistorico(orcamento!.id),
    enabled: !!orcamento,
  });

  // Links assinados gerados ao abrir: o clique fica sincrono e o navegador
  // não bloqueia a nova aba do PDF.
  const links = useQuery({
    queryKey: ["anexo-links", orcamento?.id, orcamento?.anexos?.length ?? 0],
    queryFn: () => linksAnexos(orcamento!.anexos ?? []),
    enabled: !!orcamento && !!orcamento.anexos?.length,
    staleTime: 5 * 60 * 1000,
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!orcamento) return;
      let anexos: Anexo[] = orcamento.anexos ?? [];
      if (files.length) anexos = [...anexos, ...(await enviarAnexos(files))];
      await atualizarOrcamento(orcamento.id, {
        cliente: form['cliente'],
        telefone: form['telefone'] || null,
        endereco: form['endereco'] || null,
        anexos,
        vendedor: form['vendedor'],
        tipo: form['tipo'],
        valor: form['valor'] ? Number(form['valor']) : null,
        status: form['status'],
        prioridade: form['prioridade'],
        responsavel: form['responsavel'] || null,
        prazo: form['prazo'] || null,
        observacoes: form['observacoes'] || null,
      });

      const virouFechado =
        estaFechado(form['status'] ?? "") && !estaFechado(orcamento.status);
      if (virouFechado) {
        await registrarVendaFechada({ ...orcamento, status: form['status'] as string });
      }
      return virouFechado;
    },
    onSuccess: (virouFechado) => {
      if (virouFechado) {
        setConfetes(true);
        toast.success("Orçamento fechado! Venda registrada no comercial 🎉");
      } else {
        toast.success("Orçamento atualizado");
      }
      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["historico", orcamento?.id] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arquivo = useMutation({
    mutationFn: async (acao: "arquivar" | "restaurar") => {
      if (!orcamento) return;
      if (acao === "arquivar") await arquivarOrcamento(orcamento.id);
      else await restaurarOrcamento(orcamento.id);
      return acao;
    },
    onSuccess: (acao) => {
      toast.success(acao === "restaurar" ? "Orçamento restaurado" : "Orçamento arquivado");
      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      qc.invalidateQueries({ queryKey: ["arquivados"] });
      qc.invalidateQueries({ queryKey: ["historico", orcamento?.id] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
    <Confetes ativo={confetes} onFim={() => setConfetes(false)} />
    <Dialog open={!!orcamento} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        {orcamento ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-mono text-base">
                {orcamento.numero}
                <StatusBadge value={orcamento.status} />
                <PrioridadeBadge value={orcamento.prioridade} />
              </DialogTitle>
              <DialogDescription>
                Pedido em {formatData(orcamento.data_pedido)} · {diasAberto(orcamento)} dias
                {orcamento.data_conclusao
                  ? ` · concluído em ${formatData(orcamento.data_conclusao)}`
                  : " em aberto"}
              </DialogDescription>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copiarResumo(orcamento)
                      .then(() => toast.success("Resumo copiado"))
                      .catch(() => toast.error("Não foi possível copiar o resumo"))
                  }
                >
                  <Copy className="size-3.5" />
                  Copiar resumo
                </Button>
              </div>
            </DialogHeader>

            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
              {resumoOrcamento(orcamento)}
            </pre>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cliente">
                <Input
                  value={form['cliente'] ?? ""}
                  onChange={(e) => set("cliente")(e.target.value)}
                />
              </Field>
              <Field label="Telefone do cliente">
                <Input
                  value={form['telefone'] ?? ""}
                  onChange={(e) => set("telefone")(e.target.value)}
                />
              </Field>
              <Field label="Endereço do cliente">
                <Input
                  value={form['endereco'] ?? ""}
                  onChange={(e) => set("endereco")(e.target.value)}
                />
              </Field>
              <Field label="Vendedor">
                <Input
                  value={form['vendedor'] ?? ""}
                  onChange={(e) => set("vendedor")(e.target.value)}
                />
              </Field>
              <Field label="Tipo">
                <Picker value={form['tipo']} onChange={set("tipo")} options={config.orcamento_tipos} />
              </Field>
              <Field label="VALOR">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form['valor'] ?? ""}
                  onChange={(e) => set("valor")(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </Field>
              <Field label="Responsável">
                <Picker
                  value={form['responsavel']}
                  onChange={set("responsavel")}
                  options={config.orcamento_responsaveis}
                />
              </Field>
              <Field label="Anexos / PDF">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf,image/*"
                  onChange={(e) => {
                    const novos = Array.from(e.target.files ?? []);
                    setFiles((prev) => {
                      const juntos = [...prev];
                      for (const f of novos) {
                        if (!juntos.some((x) => x.name === f.name && x.size === f.size))
                          juntos.push(f);
                      }
                      return juntos;
                    });
                    e.target.value = "";
                  }}
                />
                {files.length ? (
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${f.size}-${i}`}
                        className="flex items-center justify-between gap-2 rounded border border-border bg-muted/40 px-2 py-1 text-xs"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Novos arquivos são enviados ao salvar.
                  </p>
                )}
              </Field>
              <Field label="Prioridade">
                <Picker
                  value={form['prioridade']}
                  onChange={set("prioridade")}
                  options={[...PRIORIDADES]}
                />
              </Field>
              <Field label="Status">
                <Picker
                  value={form['status']}
                  onChange={set("status")}
                  options={[...STATUS]}
                />
              </Field>
              <Field label="Prazo">
                <Input
                  type="date"
                  value={form['prazo'] ?? ""}
                  onChange={(e) => set("prazo")(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Observações">
                  <Textarea
                    rows={3}
                    value={form['observacoes'] ?? ""}
                    onChange={(e) => set("observacoes")(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {orcamento.anexos?.length ? (
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Anexos</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!links.data}
                    onClick={() => {
                      const ok = abrirTodosAnexos(orcamento.anexos ?? [], links.data ?? {});
                      if (!ok) toast.error("O navegador bloqueou algumas abas. Libere os pop-ups deste site.");
                    }}
                  >
                    <ExternalLink className="size-3.5" /> Abrir todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={zipando}
                    onClick={async () => {
                      setZipando(true);
                      try {
                        await baixarZipAnexos(orcamento);
                        toast.success("ZIP gerado com o nome do cliente.");
                      } catch (e) {
                        toast.error((e as Error).message || "Falha ao gerar o ZIP.");
                      } finally {
                        setZipando(false);
                      }
                    }}
                  >
                    <FileArchive className="size-3.5" /> {zipando ? "Gerando ZIP…" : "Baixar ZIP"}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-8 w-40"
                      placeholder="WhatsApp: 48 99999-9999"
                      value={zapNumero}
                      onChange={(e) => setZapNumero(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={zipando}
                      onClick={async () => {
                        setZipando(true);
                        try {
                          await exportarZipWhatsapp(orcamento, zapNumero);
                          toast.success("ZIP baixado. Anexe-o na conversa aberta do WhatsApp.");
                        } catch (e) {
                          toast.error((e as Error).message || "Falha ao exportar.");
                        } finally {
                          setZipando(false);
                        }
                      }}
                    >
                      <Send className="size-3.5" /> Exportar ZIP p/ WhatsApp
                    </Button>
                  </div>
                </div>
                {links.isError ? (
                  <p className="text-sm text-urgente">
                    Não foi possível gerar os links dos anexos. Feche e abra o orçamento novamente.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {orcamento.anexos.map((a) => {
                    const url = links.data?.[a.caminho];
                    return (
                      <Button
                        key={a.caminho}
                        asChild={!!url}
                        variant="outline"
                        size="sm"
                        disabled={!url}
                      >
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="size-3.5" />
                            {a.nome}
                          </a>
                        ) : (
                          <span>
                            <Paperclip className="size-3.5" />
                            {a.nome}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}


            <div>
              <p className="mb-2 text-sm font-semibold">Histórico</p>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
                {(historico.data ?? []).length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Sem registros.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {(historico.data ?? []).map((h) => (
                      <li key={h.id} className="flex flex-wrap gap-x-2 px-3 py-2">
                        <span className="text-muted-foreground">
                          {formatData(h.created_at, true)}
                        </span>
                        {h.campo === "criacao" ? (
                          <span>Orçamento criado</span>
                        ) : (
                          <span>
                            <b>{h.campo}</b>: {h.valor_anterior ?? "—"} →{" "}
                            {h.valor_novo ?? "—"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              {!podeEditar ? (
                <SomenteLeitura />
              ) : orcamento.arquivado_em ? (
                <Button
                  variant="outline"
                  onClick={() => arquivo.mutate("restaurar")}
                  disabled={arquivo.isPending}
                >
                  <ArchiveRestore className="size-4" />
                  Restaurar orçamento
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Arquivar/excluir este orçamento? Ele será movido para Arquivados, mantendo todos os dados e o histórico.",
                      )
                    )
                      arquivo.mutate("arquivar");
                  }}
                  disabled={arquivo.isPending}
                >
                  <Archive className="size-4" />
                  Arquivar/Excluir
                </Button>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                {podeEditar ? (
                  <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                    {salvar.isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
