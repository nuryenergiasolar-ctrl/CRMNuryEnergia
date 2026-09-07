import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Painel, Vazio } from "@/components/ComercialUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listarVendedores, moeda } from "@/lib/leads";
import {
  TIPOS_META,
  excluirMeta,
  labelTipoMeta,
  listarMetas,
  salvarMeta,
  type Meta,
} from "@/lib/metas";
import { usePapel } from "@/lib/usePapel";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

const VAZIO = {
  titulo: "",
  vendedor: "",
  tipo: "faturamento",
  valor: "",
  periodo_inicio: new Date().toISOString().slice(0, 10),
  periodo_fim: "",
  observacoes: "",
};

function formatarData(valor: string | null): string {
  if (!valor) return "—";
  return new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR");
}

export function MetasPanel() {
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<Meta | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();

  const { data: metas = [], isLoading } = useQuery({ queryKey: ["metas"], queryFn: listarMetas });
  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: listarVendedores,
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error("Informe o título da meta.");
      if (!form.valor) throw new Error("Informe o valor da meta.");
      await salvarMeta({
        ...(editando ? { id: editando.id } : {}),
        titulo: form.titulo.trim(),
        vendedor: form.vendedor || null,
        tipo: form.tipo,
        valor: Number(form.valor),
        periodo_inicio: form.periodo_inicio,
        periodo_fim: form.periodo_fim || null,
        observacoes: form.observacoes.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      setForm(VAZIO);
      setEditando(null);
      setMostrarForm(false);
      toast.success("Meta salva.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: (id: string) => excluirMeta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      toast.success("Meta excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Painel
      titulo="Metas"
      descricao="Metas de faturamento, vendas e leads por vendedor ou para a equipe."
      acoes={
        podeEditar ? (
          <Button
            size="sm"
            variant={mostrarForm ? "ghost" : "default"}
            onClick={() => {
              setMostrarForm(!mostrarForm);
              setEditando(null);
              setForm(VAZIO);
            }}
          >
            <PlusCircle className="size-4" /> {mostrarForm ? "Fechar" : "Nova meta"}
          </Button>
        ) : null
      }
    >
      {podeEditar && mostrarForm ? (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendedor</Label>
              <select
                className={selectClass}
                value={form.vendedor}
                onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
              >
                <option value="">Equipe (todos)</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.nome}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de meta</Label>
              <select
                className={selectClass}
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS_META.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Valor *</Label>
              <Input
                type="number"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input
                type="date"
                value={form.periodo_inicio}
                onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <Input
                type="date"
                value={form.periodo_fim}
                onChange={(e) => setForm({ ...form, periodo_fim: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Input
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              Salvar meta
            </Button>
            {editando ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditando(null);
                  setForm(VAZIO);
                }}
              >
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <Vazio texto="Carregando metas…" />
      ) : metas.length === 0 ? (
        <Vazio texto="Nenhuma meta cadastrada." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1 text-left">Meta</th>
                <th className="py-1 text-left">Alvo</th>
                <th className="py-1 text-left">Tipo</th>
                <th className="py-1 text-right">Valor</th>
                <th className="py-1 text-left">Período</th>
                {podeEditar ? <th className="py-1 text-right">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {metas.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-1.5 font-medium">
                    {m.titulo}
                    {m.observacoes ? (
                      <span className="block text-xs text-muted-foreground">{m.observacoes}</span>
                    ) : null}
                  </td>
                  <td className="py-1.5">{m.vendedor ?? "Equipe"}</td>
                  <td className="py-1.5">{labelTipoMeta(m.tipo)}</td>
                  <td className="py-1.5 text-right">
                    {m.tipo === "faturamento" ? moeda(Number(m.valor)) : Number(m.valor)}
                  </td>
                  <td className="py-1.5 text-xs text-muted-foreground">
                    {formatarData(m.periodo_inicio)} → {formatarData(m.periodo_fim)}
                  </td>
                  {podeEditar ? (
                    <td className="py-1.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditando(m);
                            setMostrarForm(true);
                            setForm({
                              titulo: m.titulo,
                              vendedor: m.vendedor ?? "",
                              tipo: m.tipo,
                              valor: String(m.valor ?? ""),
                              periodo_inicio: m.periodo_inicio,
                              periodo_fim: m.periodo_fim ?? "",
                              observacoes: m.observacoes ?? "",
                            });
                          }}
                        >
                          <Pencil className="size-3.5" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Excluir a meta "${m.titulo}"?`)) remover.mutate(m.id);
                          }}
                        >
                          <Trash2 className="size-3.5" /> Excluir
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Painel>
  );
}
