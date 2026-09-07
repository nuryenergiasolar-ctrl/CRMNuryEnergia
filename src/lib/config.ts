import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Chave única onde as configurações do sistema ficam salvas. */
const CHAVE = "sistema";

export type ConfigSistema = {
  empresa_nome: string;
  empresa_subtitulo: string;
  orcamento_tipos: string[];
  orcamento_responsaveis: string[];
  lead_tipos: string[];
  lead_origens: string[];
  lead_motivos_perda: string[];
  followup_tipos: string[];
  pipeline_labels: Record<string, string>;
};

export const CONFIG_PADRAO: ConfigSistema = {
  empresa_nome: "NURY ENERGIA",
  empresa_subtitulo: "Controle de Orçamentos",
  orcamento_tipos: [
    "Solar",
    "Carregador Veicular",
    "BESS",
    "Usina de Investimento",
    "Outros",
  ],
  orcamento_responsaveis: ["Ismael", "Alanna"],
  lead_tipos: [
    "Residencial",
    "Comercial",
    "Carregador Veicular",
    "Usina de Investimento",
    "BESS",
    "Rural",
    "Industrial",
    "Investidor",
  ],
  lead_origens: [
    "Instagram Ads",
    "Facebook Ads",
    "Google Ads",
    "WhatsApp",
    "Indicação",
    "Site",
    "Outros",
  ],
  lead_motivos_perda: [
    "Preço",
    "Não respondeu",
    "Comprou concorrente",
    "Projeto cancelado",
    "Sem crédito",
    "Outros",
  ],
  followup_tipos: ["WhatsApp", "Ligação", "E-mail", "Visita", "Reunião"],
  pipeline_labels: {
    "Novo lead": "Novo Lead",
    "Em atendimento": "Em Atendimento",
    Qualificado: "Qualificado",
    "Proposta enviada": "Proposta Enviada",
    Negociação: "Negociação",
    Ganho: "Fechado",
    Perdido: "Perdido / Lead Frio",
  },
};

/** Rótulos amigáveis de cada grupo de opções editáveis. */
export const CONFIG_LISTAS: {
  campo: keyof ConfigSistema;
  titulo: string;
  descricao: string;
}[] = [
  {
    campo: "orcamento_tipos",
    titulo: "Tipos de orçamento",
    descricao: "Opções disponíveis no campo Tipo do orçamento.",
  },
  {
    campo: "orcamento_responsaveis",
    titulo: "Responsáveis pelo orçamento",
    descricao: "Quem pode ser designado como responsável técnico.",
  },
  {
    campo: "lead_tipos",
    titulo: "Tipos de cliente (leads)",
    descricao: "Segmentos usados no cadastro e nos filtros de leads.",
  },
  {
    campo: "lead_origens",
    titulo: "Origens de lead",
    descricao: "Canais de captação disponíveis no cadastro de leads.",
  },
  {
    campo: "lead_motivos_perda",
    titulo: "Motivos de perda",
    descricao: "Opções registradas quando um lead é marcado como perdido.",
  },
  {
    campo: "followup_tipos",
    titulo: "Tipos de follow-up",
    descricao: "Formas de contato usadas na agenda de follow-ups.",
  },
];

function normalizar(valor: unknown): ConfigSistema {
  const bruto = (valor ?? {}) as Partial<ConfigSistema>;
  const saida = { ...CONFIG_PADRAO };
  for (const chave of Object.keys(CONFIG_PADRAO) as (keyof ConfigSistema)[]) {
    const v = bruto[chave];
    if (chave === "pipeline_labels") {
      saida.pipeline_labels = {
        ...CONFIG_PADRAO.pipeline_labels,
        ...((v as Record<string, string> | undefined) ?? {}),
      };
    } else if (Array.isArray(CONFIG_PADRAO[chave])) {
      const lista = Array.isArray(v) ? (v as string[]).filter((x) => !!String(x).trim()) : [];
      if (lista.length > 0) (saida[chave] as string[]) = lista;
    } else if (typeof v === "string" && v.trim()) {
      (saida[chave] as string) = v.trim();
    }
  }
  return saida;
}

export async function carregarConfig(): Promise<ConfigSistema> {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", CHAVE)
    .maybeSingle();
  if (error) throw error;
  return normalizar(data?.valor);
}

export async function salvarConfig(config: ConfigSistema): Promise<void> {
  const { error } = await supabase
    .from("configuracoes")
    .upsert({ chave: CHAVE, valor: config as never }, { onConflict: "chave" });
  if (error) throw error;
}

/** Configurações do sistema; devolve os padrões enquanto carrega. */
export function useConfig() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: carregarConfig,
    staleTime: 5 * 60 * 1000,
  });
  return {
    config: data ?? CONFIG_PADRAO,
    carregando: isLoading,
    invalidar: () => queryClient.invalidateQueries({ queryKey: ["configuracoes"] }),
  };
}
