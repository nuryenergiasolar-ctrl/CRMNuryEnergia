import { supabase } from "@/integrations/supabase/client";

export const TIPOS = [
  "Solar",
  "Carregador Veicular",
  "BESS",
  "Usina de Investimento",
  "Outros",
] as const;

export const PRIORIDADES = ["Urgente", "Alta", "Normal"] as const;

export const RESPONSAVEIS = ["Ismael", "Alanna"] as const;


export const STATUS = [
  "Novo/Pendente",
  "Em orçamento",
  "Aguardando informação",
  "Pronto",
  "Enviado ao vendedor",
  "Fechado",
  "Cancelado",
] as const;

export const STATUS_ICON: Record<string, string> = {
  "Novo/Pendente": "📥",
  "Em orçamento": "⚙️",
  "Aguardando informação": "⏳",
  Pronto: "✅",
  "Enviado ao vendedor": "📤",
  Fechado: "🎉",
  // legado (registros antigos)
  Finalizado: "🎉",
  Cancelado: "❌",
};

export const PRIORIDADE_ICON: Record<string, string> = {
  Urgente: "🔴",
  Alta: "🟠",
  Normal: "🟢",
};

export const STATUS_ABERTOS = [
  "Novo/Pendente",
  "Em orçamento",
  "Aguardando informação",
  "Pronto",
];

export const STATUS_ENCERRADOS = ["Fechado", "Finalizado", "Cancelado"];

/** Status que representa venda fechada (inclui o nome legado "Finalizado"). */
export const STATUS_FECHADO = "Fechado";
export function estaFechado(status: string) {
  return status === "Fechado" || status === "Finalizado";
}

export type Anexo = { nome: string; caminho: string };

export type Orcamento = {
  id: string;
  numero: string;
  data_pedido: string;
  cliente: string;
  vendedor: string;
  tipo: string;
  equipamento: string | null;
  potencia: string | null;
  telefone: string | null;
  endereco: string | null;

  prioridade: string;
  prazo: string | null;
  responsavel: string | null;
  status: string;
  observacoes: string | null;
  data_conclusao: string | null;
  valor: number | null;
  arquivado_em: string | null;
  anexos: Anexo[];
  created_at: string;
  updated_at: string;
};

export type Historico = {
  id: string;
  orcamento_id: string;
  campo: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  created_at: string;
};

const MS_DIA = 86400000;

function hoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parsePrazo(prazo: string | null) {
  if (!prazo) return null;
  const [y, m, d] = prazo.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Status em que o orçamento ainda pode entrar em atraso (até ficar Pronto). */
export const STATUS_EM_ATRASO_POSSIVEL = [
  "Novo/Pendente",
  "Em orçamento",
  "Aguardando informação",
];

/** Prazo limite: data informada (fim do dia) ou 24h após o pedido. */
export function prazoLimite(o: Orcamento): Date {
  const p = parsePrazo(o.prazo);
  if (p) return new Date(p.getFullYear(), p.getMonth(), p.getDate(), 23, 59, 59);
  return new Date(new Date(o.data_pedido).getTime() + MS_DIA);
}

/** Dias restantes até o prazo (negativo = atrasado). */
export function diasParaPrazo(o: Orcamento): number | null {
  const limite = prazoLimite(o);
  const dia = new Date(limite.getFullYear(), limite.getMonth(), limite.getDate());
  return Math.round((dia.getTime() - hoje().getTime()) / MS_DIA);
}

export function diasAberto(o: Orcamento): number {
  const inicio = new Date(o.data_pedido);
  const fim = o.data_conclusao ? new Date(o.data_conclusao) : new Date();
  return Math.max(0, Math.floor((fim.getTime() - inicio.getTime()) / MS_DIA));
}

export function estaAberto(o: Orcamento) {
  return STATUS_ABERTOS.includes(o.status);
}

export function estaAtrasado(o: Orcamento) {
  if (!STATUS_EM_ATRASO_POSSIVEL.includes(o.status)) return false;
  return Date.now() > prazoLimite(o).getTime();
}

export function prazoProximo(o: Orcamento) {
  if (estaAtrasado(o) || !estaAberto(o)) return false;
  const d = diasParaPrazo(o);
  return d !== null && d >= 0 && d <= 2;
}

export function formatData(v: string | null, comHora = false) {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export async function listarOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .is("arquivado_em", null)
    .order("data_pedido", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Orcamento[];
}

export async function listarArquivados(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .not("arquivado_em", "is", null)
    .order("arquivado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Orcamento[];
}

export async function arquivarOrcamento(id: string) {
  const { error } = await supabase
    .from("orcamentos")
    .update({ arquivado_em: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function restaurarOrcamento(id: string) {
  const { error } = await supabase
    .from("orcamentos")
    .update({ arquivado_em: null } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function listarHistorico(orcamentoId: string): Promise<Historico[]> {
  const { data, error } = await supabase
    .from("orcamento_historico")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Historico[];
}

/**
 * Previsão de vendas e ciclo comercial a partir dos orçamentos.
 * - emAberto: soma dos valores dos orçamentos ainda em andamento
 * - taxaGanho: fechados / (fechados + cancelados)
 * - previsao: valor em aberto ponderado pela taxa de ganho
 * - cicloMedio: média de dias entre o pedido e o fechamento
 */
export function previsaoComercial(orcamentos: Orcamento[]) {
  const abertos = orcamentos.filter(estaAberto);
  const fechados = orcamentos.filter((o) => estaFechado(o.status));
  const cancelados = orcamentos.filter((o) => o.status === "Cancelado");
  const encerrados = fechados.length + cancelados.length;

  const emAberto = abertos.reduce((s, o) => s + Number(o.valor ?? 0), 0);
  const faturamento = fechados.reduce((s, o) => s + Number(o.valor ?? 0), 0);
  const taxaGanho = encerrados ? fechados.length / encerrados : 0;
  const ciclos = fechados
    .filter((o) => o.data_conclusao)
    .map((o) => diasAberto(o));
  const cicloMedio = ciclos.length
    ? ciclos.reduce((s, d) => s + d, 0) / ciclos.length
    : 0;

  return {
    abertos: abertos.length,
    emAberto,
    fechados: fechados.length,
    faturamento,
    taxaGanho,
    previsao: emAberto * taxaGanho,
    cicloMedio,
    ticketMedio: fechados.length ? faturamento / fechados.length : 0,
  };
}

export type NovoOrcamento = {
  cliente: string;
  vendedor: string;
  telefone: string;
  endereco: string;
  tipo: string;
  valor: number | null;
  prazo: string | null;
  prioridade: string;
  responsavel: string | null;
  observacoes: string | null;
  anexos: Anexo[];
};


export async function criarOrcamento(input: NovoOrcamento) {
  const { data, error } = await supabase
    .from("orcamentos")
    // numero é gerado automaticamente pelo banco
    .insert({ ...input, numero: "" } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Orcamento;
}

export async function atualizarOrcamento(id: string, patch: Record<string, unknown>) {
  const final = { ...patch };
  if (typeof patch['status'] === "string") {
    final['data_conclusao'] = STATUS_ENCERRADOS.includes(patch['status'])
      ? new Date().toISOString()
      : null;
  }
  const { error } = await supabase
    .from("orcamentos")
    .update(final as never)
    .eq("id", id);
  if (error) throw error;
}

export async function enviarAnexos(files: File[]): Promise<Anexo[]> {
  const out: Anexo[] = [];
  for (const file of files) {
    const caminho = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("anexos").upload(caminho, file);
    if (error) throw error;
    out.push({ nome: file.name, caminho });
  }
  return out;
}

/** Gera links assinados para todos os anexos (usado ao abrir o orçamento). */
export async function linksAnexos(anexos: Anexo[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    anexos.map(async (a) => {
      const { data } = await supabase.storage
        .from("anexos")
        .createSignedUrl(a.caminho, 60 * 60);
      if (data?.signedUrl) out[a.caminho] = data.signedUrl;
    }),
  );
  return out;
}

export async function abrirAnexo(caminho: string) {
  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(caminho, 60 * 10);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Não foi possível gerar o link do anexo.");
  }
  const url = data.signedUrl;
  const aba = window.open(url, "_blank", "noopener,noreferrer");
  if (aba) return;
  // Popup bloqueado: abre por meio de um link temporário.
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Resumo em texto do orçamento, para copiar e enviar ao vendedor. */
export function resumoOrcamento(o: Orcamento) {
  const numeroCurto = o.numero.split("-").pop() ?? o.numero;
  return [
    `N°${numeroCurto}`,
    `Cliente: ${o.cliente}`,
    `Telefone: ${o.telefone || "não informado"}`,
    `Vendedor: ${o.vendedor}`,
    `Tipo: ${o.tipo}`,
  ].join("\n");
}

export async function copiarResumo(o: Orcamento) {
  const texto = resumoOrcamento(o);
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  return texto;
}

/**
 * Registra o orçamento fechado como venda ganha no setor comercial.
 * Evita duplicidade usando a referência do número do orçamento.
 */
export async function registrarVendaFechada(o: Orcamento) {
  const referencia = `Orçamento ${o.numero}`;
  const { data: existente } = await supabase
    .from("leads")
    .select("id")
    .eq("campanha", referencia)
    .maybeSingle();
  if (existente) return;

  const { error } = await supabase.from("leads").insert({
    nome: o.cliente,
    telefone: o.telefone,
    origem: "Outros",
    tipo: "Residencial",
    temperatura: "Quente",
    etapa: "Ganho",
    produto: o.tipo,
    vendedor: o.vendedor,
    valor: o.valor ?? null,
    data_fechamento: new Date().toISOString(),
    ultimo_contato: new Date().toISOString(),
    campanha: referencia,
    observacoes: [referencia, o.endereco, o.observacoes].filter(Boolean).join(" · "),
  } as never);
  if (error) throw error;
}

/** Nome base do pacote de anexos: "Arquivos Anexos e Fotos - Cliente". */
export function nomePacoteAnexos(o: Orcamento) {
  const cliente = (o.cliente || "Cliente").replace(/[\\/:*?"<>|]/g, "-").trim();
  return `Arquivos Anexos e Fotos - ${cliente}`;
}

/** Abre todos os anexos em abas simultâneas (usa links já assinados). */
export function abrirTodosAnexos(anexos: Anexo[], links: Record<string, string>) {
  let bloqueado = false;
  for (const a of anexos) {
    const url = links[a.caminho];
    if (!url) continue;
    const aba = window.open(url, "_blank", "noopener,noreferrer");
    if (!aba) bloqueado = true;
  }
  return !bloqueado;
}

/** Baixa todos os anexos num único arquivo .zip nomeado pelo cliente. */
export async function baixarZipAnexos(o: Orcamento): Promise<Blob> {
  const anexos = o.anexos ?? [];
  if (!anexos.length) throw new Error("Este orçamento não possui anexos.");
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const pasta = zip.folder(nomePacoteAnexos(o))!;
  for (const a of anexos) {
    const { data, error } = await supabase.storage.from("anexos").download(a.caminho);
    if (error || !data) throw error ?? new Error(`Falha ao baixar ${a.nome}`);
    pasta.file(a.nome, data);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomePacoteAnexos(o)}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob;
}

/** Somente dígitos, com DDI 55 quando o número é nacional. */
export function normalizarWhatsapp(numero: string) {
  const d = numero.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

/**
 * Gera o ZIP (baixado na máquina) e abre a conversa do WhatsApp com o resumo,
 * pronta para anexar o arquivo — o WhatsApp Web não aceita anexos por link.
 */
export async function exportarZipWhatsapp(o: Orcamento, numero: string) {
  const fone = normalizarWhatsapp(numero);
  if (!fone) throw new Error("Informe o número do WhatsApp.");
  await baixarZipAnexos(o);
  const texto = `${resumoOrcamento(o)}\n\nArquivo: ${nomePacoteAnexos(o)}.zip`;
  window.open(
    `https://wa.me/${fone}?text=${encodeURIComponent(texto)}`,
    "_blank",
    "noopener,noreferrer",
  );
}
