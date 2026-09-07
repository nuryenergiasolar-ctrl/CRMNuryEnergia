import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Painel, PeriodoFiltro, Vazio } from "@/components/ComercialUI";
import { MetasPanel } from "@/components/MetasPanel";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  filtrarPorPeriodo,
  listarLeads,
  listarVendedores,
  moeda,
  pct,
  porVendedor,
  salvarVendedor,
  type Periodo,
  type Vendedor,
} from "@/lib/leads";
import { usePapel } from "@/lib/usePapel";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe Comercial | Nury Energia" },
      {
        name: "description",
        content:
          "Equipe de vendas da Nury Energia com metas mensais, conversão e faturamento por vendedor.",
      },
      { property: "og:title", content: "Equipe Comercial | Nury Energia" },
      {
        property: "og:description",
        content: "Cadastro de vendedores, metas e acompanhamento de desempenho.",
      },
    ],
  }),
  component: Equipe,
});

const VAZIO = { nome: "", email: "", telefone: "", meta_mensal: "" };

function Equipe() {
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<Vendedor | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();

  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["vendedores"],
    queryFn: listarVendedores,
  });
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const desempenho = porVendedor(filtrarPorPeriodo(leads, periodo));

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do vendedor.");
      await salvarVendedor({
        ...(editando ? { id: editando.id } : {}),
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        meta_mensal: form.meta_mensal ? Number(form.meta_mensal) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      setForm(VAZIO);
      setEditando(null);
      toast.success("Vendedor salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarAtivo = useMutation({
    mutationFn: (v: Vendedor) => salvarVendedor({ id: v.id, nome: v.nome, ativo: !v.ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendedores"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Equipe comercial"
      description="Vendedores, metas e desempenho no período."
      actions={<PeriodoFiltro valor={periodo} onChange={setPeriodo} />}
    >
      <div className="space-y-5">
        {!podeEditar ? <SomenteLeitura /> : null}
        {podeEditar ? (
        <Painel titulo={editando ? `Editar: ${editando.nome}` : "Novo vendedor"}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Meta mensal (R$)</Label>
              <Input
                type="number"
                value={form.meta_mensal}
                onChange={(e) => setForm({ ...form, meta_mensal: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              <PlusCircle className="size-4" /> Salvar
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
        </Painel>
        ) : null}

        <Painel titulo="Vendedores e desempenho">
          {isLoading ? (
            <Vazio texto="Carregando equipe…" />
          ) : vendedores.length === 0 ? (
            <Vazio texto="Nenhum vendedor cadastrado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">Vendedor</th>
                    <th className="py-1 text-right">Meta</th>
                    <th className="py-1 text-right">Leads</th>
                    <th className="py-1 text-right">Vendas</th>
                    <th className="py-1 text-right">Conversão</th>
                    <th className="py-1 text-right">Faturamento</th>
                    <th className="py-1 text-right">% da meta</th>
                    <th className="py-1 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map((v) => {
                    const d = desempenho.find((x) => x.vendedor === v.nome);
                    const meta = Number(v.meta_mensal ?? 0);
                    const fat = d?.faturamento ?? 0;
                    return (
                      <tr key={v.id} className="border-t border-border">
                        <td className="py-1.5 font-medium">
                          {v.nome}
                          {!v.ativo ? (
                            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              inativo
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1.5 text-right">{meta ? moeda(meta) : "—"}</td>
                        <td className="py-1.5 text-right">{d?.leads ?? 0}</td>
                        <td className="py-1.5 text-right">{d?.vendas ?? 0}</td>
                        <td className="py-1.5 text-right">{pct(d?.conversao ?? 0)}</td>
                        <td className="py-1.5 text-right">{moeda(fat)}</td>
                        <td className="py-1.5 text-right">
                          {meta ? pct((fat / meta) * 100) : "—"}
                        </td>
                        {podeEditar ? (
                        <td className="py-1.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditando(v);
                                setForm({
                                  nome: v.nome,
                                  email: v.email ?? "",
                                  telefone: v.telefone ?? "",
                                  meta_mensal: v.meta_mensal ? String(v.meta_mensal) : "",
                                });
                              }}
                            >
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => alternarAtivo.mutate(v)}>
                              {v.ativo ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Painel>

        <MetasPanel />
      </div>
    </AppShell>
  );
}
