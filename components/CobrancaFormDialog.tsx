import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  criarCobranca,
  diaISO,
  FORMAS_PAGAMENTO,
  moeda,
  type NovaCobranca,
} from "@/lib/cobrancas";
import { listarOrcamentos } from "@/lib/orcamentos";

const vazio = {
  orcamento_id: "",
  cliente: "",
  telefone: "",
  endereco: "",
  vendedor: "",
  tipo: "",
  descricao: "",
  forma_pagamento: "Pix",
  observacoes: "",
  valorTotal: "",
  parcelas: "1",
  primeiroVencimento: diaISO(new Date()),
};

export function CobrancaFormDialog({ gatilho }: { gatilho: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const queryClient = useQueryClient();
  const { data: orcamentos = [] } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });

  function set<K extends keyof typeof vazio>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function vincular(id: string) {
    const o = orcamentos.find((x) => x.id === id);
    if (!o) {
      setForm((f) => ({ ...f, orcamento_id: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      orcamento_id: o.id,
      cliente: o.cliente,
      telefone: o.telefone ?? "",
      endereco: o.endereco ?? "",
      vendedor: o.vendedor ?? "",
      tipo: o.tipo ?? "",
      descricao: `Orçamento ${o.numero}`,
      valorTotal: o.valor != null ? String(o.valor) : f.valorTotal,
    }));
  }

  const valorTotal = Number(form.valorTotal.replace(",", ".")) || 0;
  const parcelas = Math.max(1, Number(form.parcelas) || 1);

  async function salvar() {
    if (!form.cliente.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (valorTotal <= 0) {
      toast.error("Informe o valor total a cobrar.");
      return;
    }
    const payload: NovaCobranca = {
      orcamento_id: form.orcamento_id || null,
      cliente: form.cliente.trim(),
      telefone: form.telefone.trim() || null,
      endereco: form.endereco.trim() || null,
      vendedor: form.vendedor.trim() || null,
      tipo: form.tipo.trim() || null,
      descricao: form.descricao.trim() || null,
      forma_pagamento: form.forma_pagamento || null,
      observacoes: form.observacoes.trim() || null,
      valorTotal,
      parcelas,
      primeiroVencimento: form.primeiroVencimento,
    };
    setSalvando(true);
    try {
      await criarCobranca(payload);
      await queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      toast.success(`${parcelas} parcela(s) lançada(s) na agenda de cobranças.`);
      setForm(vazio);
      setAberto(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova cobrança parcelada</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Vincular a um orçamento (opcional)</Label>
            <select
              value={form.orcamento_id}
              onChange={(e) => vincular(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Sem vínculo — preencher manualmente</option>
              {orcamentos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.numero} · {o.cliente} · {o.tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Cliente *</Label>
            <Input
              value={form.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <Input
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Vendedor</Label>
            <Input
              value={form.vendedor}
              onChange={(e) => set("vendedor", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Tipo / produto</Label>
            <Input
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Valor total (R$) *</Label>
            <Input
              inputMode="decimal"
              value={form.valorTotal}
              onChange={(e) => set("valorTotal", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nº de parcelas</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={form.parcelas}
              onChange={(e) => set("parcelas", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>1º vencimento</Label>
            <Input
              type="date"
              value={form.primeiroVencimento}
              onChange={(e) => set("primeiroVencimento", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <select
              value={form.forma_pagamento}
              onChange={(e) => set("forma_pagamento", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          Serão criadas <strong>{parcelas}</strong> parcela(s) mensais de aproximadamente{" "}
          <strong>{moeda(valorTotal / parcelas)}</strong>, a partir de{" "}
          {form.primeiroVencimento.split("-").reverse().join("/")}.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Lançar parcelas"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
