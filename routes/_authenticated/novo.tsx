import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
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
import {
  PRIORIDADES,
  criarOrcamento,
  enviarAnexos,
  type Anexo,
} from "@/lib/orcamentos";
import { useConfig } from "@/lib/config";
import { usePapel } from "@/lib/usePapel";


type BuscaNovo = {
  cliente?: string | undefined;
  vendedor?: string | undefined;
  telefone?: string | undefined;
  endereco?: string | undefined;
  tipo?: string | undefined;
  valor?: string | undefined;
};

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export const Route = createFileRoute("/_authenticated/novo")({
  validateSearch: (s: Record<string, unknown>): BuscaNovo => ({
    cliente: texto(s["cliente"]),
    vendedor: texto(s["vendedor"]),
    telefone: texto(s["telefone"]),
    endereco: texto(s["endereco"]),
    tipo: texto(s["tipo"]),
    valor: texto(s["valor"]),
  }),
  head: () => ({
    meta: [
      { title: "Novo Orçamento | Nury Energia" },
      {
        name: "description",
        content:
          "Cadastre um novo pedido de orçamento com cliente, vendedor, tipo, equipamento, prazo, prioridade e responsável.",
      },
      { property: "og:title", content: "Novo Orçamento | Nury Energia" },
      {
        property: "og:description",
        content: "Formulário de abertura de pedido de orçamento com numeração automática.",
      },
    ],
  }),
  component: NovoPage,
});

const inicial = {
  cliente: "",
  vendedor: "",
  telefone: "",
  endereco: "",
  tipo: "Solar",
  valor: "",
  prazo: "",
  prioridade: "Normal",
  responsavel: "",
  observacoes: "",
};

function NovoPage() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const busca = Route.useSearch();
  const [form, setForm] = useState({
    ...inicial,
    cliente: busca.cliente ?? inicial.cliente,
    vendedor: busca.vendedor ?? inicial.vendedor,
    telefone: busca.telefone ?? inicial.telefone,
    endereco: busca.endereco ?? inicial.endereco,
    tipo: busca.tipo && config.orcamento_tipos.includes(busca.tipo) ? busca.tipo : inicial.tipo,
    valor: busca.valor ?? inicial.valor,
  });
  const [files, setFiles] = useState<File[]>([]);
  const { podeEditar } = usePapel();

  const criar = useMutation({
    mutationFn: async () => {
      let anexos: Anexo[] = [];
      if (files.length) anexos = await enviarAnexos(files);
      return criarOrcamento({
        cliente: form.cliente.trim(),
        vendedor: form.vendedor.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),
        tipo: form.tipo,
        valor: form.valor ? Number(form.valor) : null,
        prazo: form.prazo || null,
        prioridade: form.prioridade,
        responsavel: form.responsavel.trim() || null,
        observacoes: form.observacoes.trim() || null,
        anexos,
      });
    },
    onSuccess: (o) => {
      toast.success(`Orçamento ${o.numero} criado`);
      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      setForm(inicial);
      setFiles([]);
      navigate({ to: "/orcamentos" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof inicial, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.cliente.trim() ||
      !form.vendedor.trim() ||
      !form.telefone.trim() ||
      !form.endereco.trim()
    ) {
      toast.error("Cliente, vendedor, telefone e endereço são obrigatórios");
      return;
    }
    if (!podeEditar) {
      toast.error("Somente administradores podem cadastrar orçamentos.");
      return;
    }
    criar.mutate();
  };


  return (
    <AppShell
      title="Novo orçamento"
      description="O número do orçamento é gerado automaticamente ao salvar."
    >
      <form
        onSubmit={submit}
        className="max-w-3xl space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Cliente *">
            <Input
              value={form.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              placeholder="Nome do cliente"
              required
            />
          </Campo>
          <Campo label="Vendedor *">
            <Input
              value={form.vendedor}
              onChange={(e) => set("vendedor", e.target.value)}
              placeholder="Nome do vendedor"
              required
            />
          </Campo>
          <Campo label="Tipo de orçamento">
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.orcamento_tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="VALOR">
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.valor}
              onChange={(e) => set("valor", e.target.value)}
              placeholder="R$ 0,00"
            />
          </Campo>
          <Campo label="Telefone do cliente *">
            <Input
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </Campo>
          <Campo label="Endereço do cliente *">
            <Input
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              placeholder="Rua, nº, bairro, cidade"
              required
            />
          </Campo>

          <Campo label="Prazo">
            <Input type="date" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} />
          </Campo>
          <Campo label="Prioridade">
            <Select value={form.prioridade} onValueChange={(v) => set("prioridade", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Responsável">
            <Select value={form.responsavel} onValueChange={(v) => set("responsavel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {config.orcamento_responsaveis.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

        </div>

        <Campo label="Observações">
          <Textarea
            rows={4}
            value={form.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Detalhes do pedido, condições, informações faltantes..."
          />
        </Campo>

        <Campo label="Anexos / documentos (PDF e outros)">
          <Input
            type="file"
            multiple
            accept=".pdf,application/pdf,image/*"
            onChange={(e) => {
              const novos = Array.from(e.target.files ?? []);
              setFiles((prev) => {
                const juntos = [...prev];
                for (const f of novos) {
                  if (!juntos.some((x) => x.name === f.name && x.size === f.size)) juntos.push(f);
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
              Você pode selecionar vários arquivos, ou adicioná-los em etapas.
            </p>
          )}
        </Campo>

        {podeEditar ? (
          <div className="flex gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? "Salvando..." : "Cadastrar orçamento"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(inicial)}>
              Limpar
            </Button>
          </div>
        ) : (
          <SomenteLeitura texto="Somente administradores podem cadastrar orçamentos." />
        )}
      </form>
    </AppShell>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
