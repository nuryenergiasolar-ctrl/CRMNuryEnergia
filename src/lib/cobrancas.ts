import { supabase } from "@/integrations/supabase/client";
import { normalizarWhatsapp } from "@/lib/orcamentos";

export const FORMAS_PAGAMENTO = [
  "Pix",
  "Boleto",
  "Cartão de crédito",
  "Transferência",
  "Dinheiro",
  "Financiamento",
] as const;

export type Cobranca = {
  id: string;
  orcamento_id: string | null;
  cliente: string;
  telefone: string | null;
  endereco: string | null;
  vendedor: string | null;
  tipo: string | null;
  descricao: string | null;
  valor: number;
  parcela: number;
  total_parcelas: number;
  vencimento: string;
  pago: boolean;
  pago_em: string | null;
  forma_pagamento: string | null;
  observacoes: string | null
  created_at: string;
  updated_at: string;
};

export type NovaCobranca = {
  orcamento_id: string | null;
  cliente: string;
  telefone: string | null;
  endereco: string | null;
  vendedor: string | null;
  tipo: string | null;
  descricao: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  valorTotal: number;
  parcelas: number;
  primeiroVencimento: string;
};

export function moeda(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Converte "YYYY-MM-DD" em Date local (evita deslocamento de fuso). */
export function parseDia(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function diaISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatarDia(v: string) {
  return parseDia(v).toLocaleDateString("pt-BR");
}

export type SituacaoCobranca = "pago" | "atrasado" | "proximo" | "aberto";

export function situacao(c: Cobranca): SituacaoCobranca {
  if (c.pago) return "pago";
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round(
    (parseDia(c.vencimento).getTime() - inicioHoje.getTime()) / 86400000,
  );
  if (dias < 0) return "atrasado";
  if (dias <= 3) return "proximo";
  return "aberto";
}

export const SITUACAO_LABEL: Record<SituacaoCobranca, string> = {
  pago: "Pago",
  atrasado: "Atrasado",
  proximo: "Vence em breve",
  aberto: "A receber",
};

export const SITUACAO_CLASSE: Record<SituacaoCobranca, string> = {
  pago: "bg-normal-soft text-normal border-normal/40",
  atrasado: "bg-urgente-soft text-urgente border-urgente/40",
  proximo: "bg-alta-soft text-alta border-alta/40",
  aberto: "bg-info-soft text-info border-info/40",
};

export async function listarCobrancas(): Promise<Cobranca[]> {
  const { data, error } = await supabase
    .from("cobrancas")
    .select("*")
    .order("vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Cobranca[];
}

/** Gera as parcelas mensais a partir do valor total informado. */
export async function criarCobranca(input: NovaCobranca) {
  const total = Math.max(1, Math.round(input.parcelas));
  const centavos = Math.round(input.valorTotal * 100);
  const base = Math.floor(centavos / total);
  const resto = centavos - base * total;
  const inicio = parseDia(input.primeiroVencimento);

  const linhas = Array.from({ length: total }, (_, i) => {
    const venc = new Date(inicio.getFullYear(), inicio.getMonth() + i, inicio.getDate());
    return {
      orcamento_id: input.orcamento_id,
      cliente: input.cliente,
      telefone: input.telefone,
      endereco: input.endereco,
      vendedor: input.vendedor,
      tipo: input.tipo,
      descricao: input.descricao,
      forma_pagamento: input.forma_pagamento,
      observacoes: input.observacoes,
      valor: (base + (i === 0 ? resto : 0)) / 100,
      parcela: i + 1,
      total_parcelas: total,
      vencimento: diaISO(venc),
    };
  });

  const { error } = await supabase.from("cobrancas").insert(linhas as never);
  if (error) throw error;
}

export async function atualizarCobranca(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("cobrancas")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function marcarPago(c: Cobranca, pago: boolean) {
  await atualizarCobranca(c.id, {
    pago,
    pago_em: pago ? new Date().toISOString() : null,
  });
}

export async function excluirCobranca(id: string) {
  const { error } = await supabase.from("cobrancas").delete().eq("id", id);
  if (error) throw error;
}

/** Mensagem de cobrança pronta para enviar no WhatsApp do cliente. */
export function mensagemCobranca(c: Cobranca) {
  return [
    `Olá, ${c.cliente}!`,
    "",
    `Lembrete da parcela ${c.parcela}/${c.total_parcelas} do seu pedido${
      c.tipo ? ` (${c.tipo})` : ""
    }.`,
    `Valor: ${moeda(c.valor)}`,
    `Vencimento: ${formatarDia(c.vencimento)}`,
    c.forma_pagamento ? `Forma de pagamento: ${c.forma_pagamento}` : "",
    "",
    "Nury Energia agradece a preferência!",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function abrirWhatsappCobranca(c: Cobranca) {
  const fone = normalizarWhatsapp(c.telefone ?? "");
  if (!fone) throw new Error("Este cliente não possui telefone cadastrado.");
  window.open(
    `https://wa.me/${fone}?text=${encodeURIComponent(mensagemCobranca(c))}`,
    "_blank",
    "noopener,noreferrer",
  );
}

/** Semanas (6x7) do mês, iniciando no domingo. */
export function gradeDoMes(ano: number, mes: number): Date[][] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(ano, mes, 1 - primeiro.getDay());
  return Array.from({ length: 6 }, (_, s) =>
    Array.from({ length: 7 }, (_, d) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + s * 7 + d);
      return dia;
    }),
  );
}

export function totais(cobrancas: Cobranca[]) {
  const recebido = cobrancas.filter((c) => c.pago).reduce((s, c) => s + c.valor, 0);
  const abertas = cobrancas.filter((c) => !c.pago);
  const aReceber = abertas.reduce((s, c) => s + c.valor, 0);
  const atrasadas = abertas.filter((c) => situacao(c) === "atrasado");
  return {
    recebido,
    aReceber,
    atrasado: atrasadas.reduce((s, c) => s + c.valor, 0),
    qtdAtrasadas: atrasadas.length,
    qtdAbertas: abertas.length,
  };
}
