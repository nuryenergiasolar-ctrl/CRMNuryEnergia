import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Painel, Vazio } from "@/components/ComercialUI";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listarLeads,
  listarProdutos,
  moeda,
  porProduto,
  salvarProduto,
  type Produto,
} from "@/lib/leads";
import { usePapel } from "@/lib/usePapel";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos | Nury Energia" },
      {
        name: "description",
        content:
          "Catálogo de produtos e serviços da Nury Energia com preço base e desempenho de vendas.",
      },
      { property: "og:title", content: "Produtos | Nury Energia" },
      {
        property: "og:description",
        content: "Cadastre produtos e veja quais geram mais faturamento.",
      },
    ],
  }),
  component: Produtos,
});

const VAZIO = { nome: "", categoria: "Solar", preco_base: "", descricao: "" };

function Produtos() {
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const queryClient = useQueryClient();
  const { podeEditar } = usePapel();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: listarProdutos,
  });
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const desempenho = porProduto(leads);

  const fechar = () => {
    setForm(VAZIO);
    setEditando(null);
    setMostrarForm(false);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do produto.");
      await salvarProduto({
        ...(editando ? { id: editando.id } : {}),
        nome: form.nome.trim(),
        categoria: form.categoria,
        preco_base: form.preco_base ? Number(form.preco_base) : null,
        descricao: form.descricao.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      fechar();
      toast.success("Produto salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarAtivo = useMutation({
    mutationFn: (p: Produto) => salvarProduto({ id: p.id, nome: p.nome, ativo: !p.ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produtos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Produtos"
      description="Catálogo usado nos leads e nos indicadores."
      actions={
        podeEditar ? (
          <Button size="sm" onClick={() => (mostrarForm ? fechar() : setMostrarForm(true))}>
            <PlusCircle className="size-4" /> {mostrarForm ? "Fechar" : "Novo produto"}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {!podeEditar ? <SomenteLeitura /> : null}

        {podeEditar && mostrarForm ? (
          <Painel titulo={editando ? `Editar: ${editando.nome}` : "Novo produto"}>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-8 w-40 text-sm"
                placeholder="Nome *"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Input
                className="h-8 w-32 text-sm"
                placeholder="Categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
              <Input
                className="h-8 w-28 text-sm"
                type="number"
                placeholder="Preço base"
                value={form.preco_base}
                onChange={(e) => setForm({ ...form, preco_base: e.target.value })}
              />
              <Input
                className="h-8 w-44 text-sm"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
              <Button size="sm" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={fechar}>
                Cancelar
              </Button>
            </div>
          </Painel>
        ) : null}

        <Painel titulo="Catálogo" descricao={`${produtos.length} itens`}>
          {isLoading ? (
            <Vazio texto="Carregando produtos…" />
          ) : produtos.length === 0 ? (
            <Vazio texto="Nenhum produto cadastrado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">Produto</th>
                    <th className="py-1 text-left">Categoria</th>
                    <th className="py-1 text-right">Preço</th>
                    <th className="py-1 text-right">Leads</th>
                    <th className="py-1 text-right">Vendas</th>
                    <th className="py-1 text-right">Faturamento</th>
                    {podeEditar ? <th className="py-1 text-right">Ações</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => {
                    const d = desempenho.find((x) => x.produto === p.nome);
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="py-1 font-medium">
                          {p.nome}
                          {!p.ativo ? (
                            <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                              inativo
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1 text-muted-foreground">{p.categoria}</td>
                        <td className="py-1 text-right">
                          {p.preco_base ? moeda(Number(p.preco_base)) : "—"}
                        </td>
                        <td className="py-1 text-right">{d?.leads ?? 0}</td>
                        <td className="py-1 text-right">{d?.vendas ?? 0}</td>
                        <td className="py-1 text-right">{moeda(d?.faturamento ?? 0)}</td>
                        {podeEditar ? (
                          <td className="py-1 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => {
                                  setEditando(p);
                                  setMostrarForm(true);
                                  setForm({
                                    nome: p.nome,
                                    categoria: p.categoria,
                                    preco_base: p.preco_base ? String(p.preco_base) : "",
                                    descricao: p.descricao ?? "",
                                  });
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => alternarAtivo.mutate(p)}
                              >
                                {p.ativo ? "Desativar" : "Ativar"}
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
      </div>
    </AppShell>
  );
}
