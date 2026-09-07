import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type NovoLead = Database["public"]["Tables"]["leads"]["Insert"];
export type Produto = Database["public"]["Tables"]["produtos"]["Row"];
export type Vendedor = Database["public"]["Tables"]["vendedores"]["Row"];
export type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];
export type Investimento = Database["public"]["Tables"]["marketing_investimentos"]["Row"];
export type Integracao = Database["public"]["Tables"]["integracoes"]["Row"];
export type LeadHistorico = Database["public"]["Tables"]["lead_historico"]["Row"];

export const ORIGENS = [
  "Instagram Ads",
  "Facebook Ads",
  "Google Ads",
  "WhatsApp",
  "Indicação",
  "Site",
  "Outros",
] as const;

export const TIPOS_LEAD = [
  "Residencial",
  "Comercial",
  "Carregador Veicular",
  "Usina de Investimento",
  "BESS",
  "Rural",
  "Industrial",
  "Investidor",
] as const;

export const TEMPERATURAS = ["Quente", "Morno", "Frio"] as const;

export const ETAPAS = [
  "Novo lead",
  "Em atendimento",
  "Qualificado",
  "Proposta enviada",
  "Negociação",
  "Ganho",
  "Perdido",
] as const;

export const ETAPAS_FUNIL = [
  "Novo lead",
  "Em atendimento",
  "Qualificado",
  "Proposta enviada",
  "Negociação",
  "Ganho",
] as const;

export const ETAPAS_ABERTAS = [
  "Novo lead",
  "Em atendimento",
  "Qualificado",
  "Proposta enviada",
  "Negociação",
];

export const MOTIVOS_PERDA = [
  "Preço",
  "Não respondeu",
  "Comprou concorrente",
  "Projeto cancelado",
  "Sem crédito",
  "Outros",
] as const;

export const CANAIS_MARKETING = [
  "Instagram Ads",
  "Facebook Ads",
  "Google Ads",
  "WhatsApp Business",
  "Outros",
] as const;

export const TIPOS_FOLLOWUP = ["WhatsApp", "Ligação", "E-mail", "Visita", "Reunião"] as const;

export const TEMPERATURA_ICON: Record<string, string> = {
  Quente: "🔥",
  Morno: "🌤️",
  Frio: "❄️",
};

export const ETAPA_COR: Record<string, string> = {
  "Novo lead": "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "Em atendimento": "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  Qualificado: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "Proposta enviada": "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  Negociação: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  Ganho: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  Perdido: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
};

export const TEMPERATURA_COR: Record<string, string> = {
  Quente: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  Morno: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  Frio: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
};

export const PERIODOS = [
  { valor: "semana", label: "Esta semana" },
  { valor: "mes", label: "Este mês" },
  { valor: "trimestre", label: "3 meses" },
  { valor: "ano", label: "Este ano" },
  { valor: "tudo", label: "Todo o período" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["valor"];

export function inicioPeriodo(periodo: Periodo): Date | null {
  const hoje = new Date();
  switch (periodo) {
    case "semana": {
      const d = new Date(hoje);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "mes":
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    case "trimestre":
      return new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    case "ano":
      return new Date(hoje.getFullYear(), 0, 1);
    default:
      return null;
  }
}

export function filtrarPorPeriodo<T extends { data_entrada?: string; data_inicio?: string }>(
  itens: T[],
  periodo: Periodo,
): T[] {
  const inicio = inicioPeriodo(periodo);
  if (!inicio) return itens;
  return itens.filter((i) => {
    const ref = i.data_entrada ?? i.data_inicio;
    return ref ? new Date(ref) >= inicio : true;
  });
}

/** Filtra qualquer lista por período usando o campo de data informado. */
export function filtrarPorData<T>(
  itens: T[],
  periodo: Periodo,
  campo: keyof T,
): T[] {
  const inicio = inicioPeriodo(periodo);
  if (!inicio) return itens;
  return itens.filter((i) => {
    const ref = i[campo] as unknown;
    if (!ref) return true;
    const data = new Date(String(ref).length <= 10 ? `${String(ref)}T12:00:00` : String(ref));
    return Number.isNaN(data.getTime()) ? true : data >= inicio;
  });
}

export function faixaTicket(valor: number | null): "Baixo" | "Médio" | "Alto" | "—" {
  if (!valor) return "—";
  if (valor <= 20000) return "Baixo";
  if (valor <= 100000) return "Médio";
  return "Alto";
}

export const FAIXA_TICKET_LABEL: Record<string, string> = {
  Baixo: "Ticket baixo (até R$ 20 mil)",
  Médio: "Ticket médio (R$ 20 mil – 100 mil)",
  Alto: "Ticket alto (acima de R$ 100 mil)",
};

export function moeda(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function pct(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function diasEntre(de: string, ate: string | null): number {
  const fim = ate ? new Date(ate) : new Date();
  return Math.max(0, Math.floor((fim.getTime() - new Date(de).getTime()) / 86_400_000));
}

export function diasSemContato(lead: Lead): number {
  return diasEntre(lead.ultimo_contato ?? lead.data_entrada, null);
}

/* ------------------------------- Dados ---------------------------------- */

export async function listarLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .is("arquivado_em", null)
    .order("data_entrada", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listarLeadsArquivados(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .not("arquivado_em", "is", null)
    .order("arquivado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function criarLead(lead: NovoLead): Promise<Lead> {
  const { data, error } = await supabase.from("leads").insert(lead).select("*").single();
  if (error) throw error;
  return data;
}

export async function atualizarLead(id: string, patch: Partial<NovoLead>): Promise<void> {
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) throw error;
}

export async function arquivarLead(id: string): Promise<void> {
  await atualizarLead(id, { arquivado_em: new Date().toISOString() });
}

export async function restaurarLead(id: string): Promise<void> {
  await atualizarLead(id, { arquivado_em: null });
}

export async function historicoLead(leadId: string): Promise<LeadHistorico[]> {
  const { data, error } = await supabase
    .from("lead_historico")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listarProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase.from("produtos").select("*").order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function salvarProduto(
  produto: Database["public"]["Tables"]["produtos"]["Insert"] & { id?: string },
): Promise<void> {
  if (produto.id) {
    const { id, ...patch } = produto;
    const { error } = await supabase.from("produtos").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("produtos").insert(produto);
  if (error) throw error;
}

export async function listarVendedores(): Promise<Vendedor[]> {
  const { data, error } = await supabase.from("vendedores").select("*").order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function salvarVendedor(
  vendedor: Database["public"]["Tables"]["vendedores"]["Insert"] & { id?: string },
): Promise<void> {
  if (vendedor.id) {
    const { id, ...patch } = vendedor;
    const { error } = await supabase.from("vendedores").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("vendedores").insert(vendedor);
  if (error) throw error;
}

export async function listarFollowUps(): Promise<FollowUp[]> {
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .is("arquivado_em", null)
    .order("data_prevista", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listarFollowUpsArquivados(): Promise<FollowUp[]> {
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .not("arquivado_em", "is", null)
    .order("arquivado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function arquivarFollowUp(id: string, arquivar: boolean): Promise<void> {
  const { error } = await supabase
    .from("follow_ups")
    .update({ arquivado_em: arquivar ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}


export async function criarFollowUp(
  followUp: Database["public"]["Tables"]["follow_ups"]["Insert"],
): Promise<void> {
  const { error } = await supabase.from("follow_ups").insert(followUp);
  if (error) throw error;
}

export async function concluirFollowUp(id: string, concluido: boolean): Promise<void> {
  const { error } = await supabase
    .from("follow_ups")
    .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function listarInvestimentos(): Promise<Investimento[]> {
  const { data, error } = await supabase
    .from("marketing_investimentos")
    .select("*")
    .order("data_inicio", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function criarInvestimento(
  inv: Database["public"]["Tables"]["marketing_investimentos"]["Insert"],
): Promise<void> {
  const { error } = await supabase.from("marketing_investimentos").insert(inv);
  if (error) throw error;
}

export async function listarIntegracoes(): Promise<Integracao[]> {
  const { data, error } = await supabase.from("integracoes").select("*").order("canal");
  if (error) throw error;
  return data ?? [];
}

export async function atualizarIntegracao(
  id: string,
  patch: Partial<Database["public"]["Tables"]["integracoes"]["Update"]>,
): Promise<void> {
  const { error } = await supabase.from("integracoes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function criarIntegracao(
  inte: Database["public"]["Tables"]["integracoes"]["Insert"],
): Promise<void> {
  const { error } = await supabase.from("integracoes").insert(inte);
  if (error) throw error;
}

/** Link público monitorável por canal (usado para gerar o QR code de conexão). */
export function linkIntegracao(canal: string, identificador: string | null): string | null {
  const id = (identificador ?? "").trim();
  if (!id) return null;
  const c = canal.toLowerCase();
  if (c.includes("whats")) {
    const fone = id.replace(/\D/g, "");
    if (!fone) return null;
    const num = fone.startsWith("55") ? fone : `55${fone}`;
    return `https://wa.me/${num}?text=${encodeURIComponent("Olá! Quero um orçamento da Nury Energia.")}`;
  }
  if (c.includes("insta")) return `https://instagram.com/${id.replace(/^@/, "")}`;
  if (c.includes("face")) return `https://facebook.com/${id.replace(/^@/, "")}`;
  if (id.startsWith("http")) return id;
  return `https://${id}`;
}

/* ---------------------------- Indicadores -------------------------------- */

export type Indicadores = {
  totalLeads: number;
  qualificados: number;
  propostas: number;
  vendas: number;
  perdidos: number;
  faturamento: number;
  conversao: number;
  ticketMedio: number;
  emNegociacao: number;
  previsao: number;
  cicloMedio: number;
  taxaGanhoHistorica: number;
  investimento: number;
  cpl: number;
  cac: number;
  roas: number;
  roi: number;
};

export function calcularIndicadores(leads: Lead[], investimentos: Investimento[]): Indicadores {
  const ganhos = leads.filter((l) => l.etapa === "Ganho");
  const perdidos = leads.filter((l) => l.etapa === "Perdido");
  const propostas = leads.filter((l) =>
    ["Proposta enviada", "Negociação", "Ganho"].includes(l.etapa),
  );
  const qualificados = leads.filter((l) =>
    ["Qualificado", "Proposta enviada", "Negociação", "Ganho"].includes(l.etapa),
  );
  const negociacao = leads.filter((l) => l.etapa === "Negociação");

  const faturamento = ganhos.reduce((s, l) => s + Number(l.valor ?? 0), 0);
  const investimento = investimentos.reduce((s, i) => s + Number(i.valor ?? 0), 0);
  const ciclos = ganhos
    .filter((l) => l.data_fechamento)
    .map((l) => diasEntre(l.data_entrada, l.data_fechamento));

  return {
    totalLeads: leads.length,
    qualificados: qualificados.length,
    propostas: propostas.length,
    vendas: ganhos.length,
    perdidos: perdidos.length,
    faturamento,
    conversao: leads.length ? (ganhos.length / leads.length) * 100 : 0,
    ticketMedio: ganhos.length ? faturamento / ganhos.length : 0,
    emNegociacao: negociacao.reduce((s, l) => s + Number(l.valor ?? 0), 0),
    previsao:
      negociacao.reduce((s, l) => s + Number(l.valor ?? 0), 0) *
      (propostas.length ? ganhos.length / propostas.length : 0),
    cicloMedio: ciclos.length ? ciclos.reduce((a, b) => a + b, 0) / ciclos.length : 0,
    taxaGanhoHistorica: propostas.length ? (ganhos.length / propostas.length) * 100 : 0,
    investimento,
    cpl: leads.length ? investimento / leads.length : 0,
    cac: ganhos.length ? investimento / ganhos.length : 0,
    roas: investimento ? faturamento / investimento : 0,
    roi: investimento ? ((faturamento - investimento) / investimento) * 100 : 0,
  };
}

export function agrupar<T>(itens: T[], chave: (i: T) => string) {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const k = chave(item) || "Não informado";
    mapa.set(k, [...(mapa.get(k) ?? []), item]);
  }
  return mapa;
}

export function porOrigem(leads: Lead[]) {
  return [...agrupar(leads, (l) => l.origem).entries()]
    .map(([origem, itens]) => {
      const vendas = itens.filter((l) => l.etapa === "Ganho");
      return {
        origem,
        leads: itens.length,
        vendas: vendas.length,
        faturamento: vendas.reduce((s, l) => s + Number(l.valor ?? 0), 0),
        conversao: itens.length ? (vendas.length / itens.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);
}

export function porProduto(leads: Lead[]) {
  return [...agrupar(leads, (l) => l.produto ?? "Não informado").entries()]
    .map(([produto, itens]) => {
      const vendas = itens.filter((l) => l.etapa === "Ganho");
      return {
        produto,
        vendas: vendas.length,
        faturamento: vendas.reduce((s, l) => s + Number(l.valor ?? 0), 0),
        leads: itens.length,
      };
    })
    .sort((a, b) => b.faturamento - a.faturamento);
}

export function porVendedor(leads: Lead[]) {
  return [...agrupar(leads, (l) => l.vendedor ?? "Sem vendedor").entries()]
    .map(([vendedor, itens]) => {
      const vendas = itens.filter((l) => l.etapa === "Ganho");
      return {
        vendedor,
        leads: itens.length,
        vendas: vendas.length,
        faturamento: vendas.reduce((s, l) => s + Number(l.valor ?? 0), 0),
        conversao: itens.length ? (vendas.length / itens.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.faturamento - a.faturamento);
}

export function motivosPerda(leads: Lead[]) {
  const perdidos = leads.filter((l) => l.etapa === "Perdido");
  return [...agrupar(perdidos, (l) => l.motivo_perda ?? "Não informado").entries()]
    .map(([motivo, itens]) => ({
      motivo,
      quantidade: itens.length,
      percentual: perdidos.length ? (itens.length / perdidos.length) * 100 : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

export function funil(leads: Lead[]) {
  const ordem = [...ETAPAS_FUNIL];
  return ordem.map((etapa, i) => {
    const alcancaram = leads.filter((l) => {
      const idx = ordem.indexOf(l.etapa as (typeof ETAPAS_FUNIL)[number]);
      return idx >= i;
    }).length;
    return {
      etapa,
      quantidade: alcancaram,
      percentual: leads.length ? (alcancaram / leads.length) * 100 : 0,
    };
  });
}

export function porFaixaTicket(leads: Lead[]) {
  const base = leads.filter((l) => l.valor);
  return ["Baixo", "Médio", "Alto"].map((faixa) => {
    const itens = base.filter((l) => faixaTicket(Number(l.valor)) === faixa);
    return {
      faixa,
      quantidade: itens.length,
      percentual: base.length ? (itens.length / base.length) * 100 : 0,
      faturamento: itens.reduce((s, l) => s + Number(l.valor ?? 0), 0),
    };
  });
}

export const JANELAS_PARADOS = [
  { label: "Sem resposta há mais de 1 dia", dias: 1 },
  { label: "Sem resposta há mais de 3 dias", dias: 3 },
  { label: "Sem resposta há mais de 7 dias", dias: 7 },
  { label: "Sem resposta há mais de 15 dias", dias: 15 },
  { label: "Sem resposta há mais de 30 dias", dias: 30 },
];

export function leadsParados(leads: Lead[]) {
  const abertos = leads.filter((l) => ETAPAS_ABERTAS.includes(l.etapa));
  return JANELAS_PARADOS.map((j) => ({
    ...j,
    quantidade: abertos.filter((l) => diasSemContato(l) > j.dias).length,
  }));
}

export function serieMensal(leads: Lead[], meses = 6) {
  const hoje = new Date();
  return Array.from({ length: meses }, (_, i) => {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1 - i), 1);
    const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const doMes = leads.filter((l) => {
      const d = new Date(l.data_entrada);
      return d >= ref && d < fim;
    });
    const vendas = doMes.filter((l) => l.etapa === "Ganho");
    return {
      mes: ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      leads: doMes.length,
      vendas: vendas.length,
      faturamento: vendas.reduce((s, l) => s + Number(l.valor ?? 0), 0),
    };
  });
}

export function serieSemanal(leads: Lead[], semanas = 8) {
  const hoje = new Date();
  const base = new Date(hoje);
  base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: semanas }, (_, i) => {
    const inicio = new Date(base);
    inicio.setDate(inicio.getDate() - (semanas - 1 - i) * 7);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
    const daSemana = leads.filter((l) => {
      const d = new Date(l.data_entrada);
      return d >= inicio && d < fim;
    });
    const vendas = daSemana.filter((l) => l.etapa === "Ganho");
    return {
      mes: inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: daSemana.length,
      vendas: vendas.length,
      faturamento: vendas.reduce((s, l) => s + Number(l.valor ?? 0), 0),
    };
  });
}

export function linkWhatsApp(telefone: string | null, mensagem?: string): string | null {
  if (!telefone) return null;
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length < 10) return null;
  const comPais = numeros.startsWith("55") ? numeros : `55${numeros}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${comPais}${texto}`;
}
