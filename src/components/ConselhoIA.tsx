import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { obterConselho } from "@/lib/conselhos.functions";
import {
  STATUS_ABERTOS,
  diasParaPrazo,
  estaAtrasado,
  listarOrcamentos,
  prazoProximo,
} from "@/lib/orcamentos";
import { useNotificacoes } from "@/hooks/useNotificacoes";

export function ConselhoIA({ tela }: { tela: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const pedir = useServerFn(obterConselho);
  const { pendentes } = useNotificacoes();

  const { data: orcamentos = [] } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });

  const resumo = () => {
    const abertos = orcamentos.filter((o) => STATUS_ABERTOS.includes(o.status));
    const atrasados = orcamentos.filter(estaAtrasado);
    const proximos = orcamentos.filter(prazoProximo);
    const urgentes = abertos.filter((o) => o.prioridade === "Urgente");
    const linhas = [
      `Total de orçamentos ativos: ${orcamentos.length}`,
      `Abertos (precisam de ação): ${abertos.length}`,
      `Urgentes abertos: ${urgentes.length}`,
      `Atrasados: ${atrasados.length}`,
      `Com prazo nos próximos 2 dias: ${proximos.length}`,
      `Data de hoje: ${new Date().toLocaleDateString("pt-BR")}`,
      `Lembretes pendentes na caixa de notificações: ${pendentes
        .slice(0, 5)
        .map((n) => n.titulo)
        .join("; ") || "nenhum"}`,
      "Casos mais críticos:",
      ...[...atrasados, ...urgentes]
        .slice(0, 8)
        .map(
          (o) =>
            `- ${o.numero} | ${o.cliente} | ${o.tipo} | ${o.status} | ${o.prioridade} | responsável: ${
              o.responsavel ?? "nenhum"
            } | dias p/ prazo: ${diasParaPrazo(o) ?? "sem prazo"}`,
        ),
    ];
    return linhas.join("\n");
  };

  async function consultar() {
    setCarregando(true);
    setErro(null);
    try {
      const r = await pedir({ data: { tela, resumo: resumo() } });
      setTexto(r.texto?.trim() || "Sem sugestão no momento.");
    } catch (e) {
      setErro((e as Error).message || "Não foi possível consultar a IA agora.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <Popover
        open={aberto}
        onOpenChange={(o) => {
          setAberto(o);
          if (o && !texto && !carregando) void consultar();
        }}
      >
        <PopoverTrigger asChild>
          <Button className="h-11 gap-2 rounded-full px-4 shadow-lg">
            <Sparkles className="size-4" />
            Conselhos operacionais
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-[360px]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">Próximo passo sugerido</p>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              title="Atualizar sugestão"
              onClick={() => void consultar()}
              disabled={carregando}
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Tela: {tela}</p>
          {carregando ? (
            <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Analisando os orçamentos...
            </p>
          ) : erro ? (
            <p className="rounded-md border border-destructive/30 bg-urgente-soft p-2 text-sm text-urgente">
              {erro}
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
