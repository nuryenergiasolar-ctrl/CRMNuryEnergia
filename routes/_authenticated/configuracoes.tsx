import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Painel } from "@/components/ComercialUI";
import { SomenteLeitura } from "@/components/SomenteLeitura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CONFIG_LISTAS,
  CONFIG_PADRAO,
  salvarConfig,
  useConfig,
  type ConfigSistema,
} from "@/lib/config";
import { usePapel } from "@/lib/usePapel";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações do Sistema | Nury Energia" },
      {
        name: "description",
        content:
          "Personalize nomes, campos, etapas e opções do CRM da Nury Energia sem precisar alterar o código.",
      },
      { property: "og:title", content: "Configurações do Sistema | Nury Energia" },
      {
        property: "og:description",
        content: "Área administrativa para editar listas, etapas e identificação da empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { config, carregando } = useConfig();
  const { podeEditar } = usePapel();
  const queryClient = useQueryClient();
  const [rascunho, setRascunho] = useState<ConfigSistema>(config);

  useEffect(() => {
    if (!carregando) setRascunho(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando]);

  const salvar = useMutation({
    mutationFn: () => salvarConfig(rascunho),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      toast.success("Configurações salvas.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function setLista(campo: keyof ConfigSistema, lista: string[]) {
    setRascunho((r) => ({ ...r, [campo]: lista }) as ConfigSistema);
  }

  return (
    <AppShell
      title="Configurações"
      description="Edite nomes, campos, etapas e opções do sistema sem depender de alterações técnicas."
      actions={
        podeEditar ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setRascunho(CONFIG_PADRAO);
                toast.info("Valores padrão carregados. Salve para aplicar.");
              }}
            >
              <RotateCcw className="size-4" /> Restaurar padrão
            </Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              <Save className="size-4" /> Salvar configurações
            </Button>
          </>
        ) : null
      }
    >
      <div className="space-y-5">
        {!podeEditar ? <SomenteLeitura /> : null}

        <Painel
          titulo="Identificação"
          descricao="Nome e subtítulo exibidos no menu lateral do sistema."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da empresa</Label>
              <Input
                value={rascunho.empresa_nome}
                disabled={!podeEditar}
                onChange={(e) => setRascunho({ ...rascunho, empresa_nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Subtítulo</Label>
              <Input
                value={rascunho.empresa_subtitulo}
                disabled={!podeEditar}
                onChange={(e) => setRascunho({ ...rascunho, empresa_subtitulo: e.target.value })}
              />
            </div>
          </div>
        </Painel>

        <div className="grid gap-4 lg:grid-cols-2">
          {CONFIG_LISTAS.map(({ campo, titulo, descricao }) => (
            <Painel key={campo} titulo={titulo} descricao={descricao}>
              <ListaEditavel
                itens={rascunho[campo] as string[]}
                editavel={podeEditar}
                onChange={(lista) => setLista(campo, lista)}
              />
            </Painel>
          ))}
        </div>

        <Painel
          titulo="Etapas do pipeline"
          descricao="Renomeie como cada etapa aparece no Kanban. A ordem e as automações do funil permanecem."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(CONFIG_PADRAO.pipeline_labels).map((etapa) => (
              <div key={etapa} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{etapa}</Label>
                <Input
                  value={rascunho.pipeline_labels[etapa] ?? ""}
                  disabled={!podeEditar}
                  onChange={(e) =>
                    setRascunho({
                      ...rascunho,
                      pipeline_labels: {
                        ...rascunho.pipeline_labels,
                        [etapa]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Painel>
      </div>
    </AppShell>
  );
}

function ListaEditavel({
  itens,
  editavel,
  onChange,
}: {
  itens: string[];
  editavel: boolean;
  onChange: (lista: string[]) => void;
}) {
  const [novo, setNovo] = useState("");

  function adicionar() {
    const v = novo.trim();
    if (!v) return;
    if (itens.includes(v)) {
      toast.error("Essa opção já existe.");
      return;
    }
    onChange([...itens, v]);
    setNovo("");
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {itens.map((item, i) => (
          <li key={`${item}-${i}`} className="flex items-center gap-2">
            <Input
              value={item}
              disabled={!editavel}
              onChange={(e) => {
                const lista = [...itens];
                lista[i] = e.target.value;
                onChange(lista);
              }}
            />
            {editavel ? (
              <Button
                size="icon"
                variant="ghost"
                title="Remover opção"
                onClick={() => onChange(itens.filter((_, idx) => idx !== i))}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {editavel ? (
        <div className="flex items-center gap-2">
          <Input
            value={novo}
            placeholder="Nova opção"
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
          />
          <Button size="icon" variant="outline" onClick={adicionar} title="Adicionar opção">
            <Plus className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
