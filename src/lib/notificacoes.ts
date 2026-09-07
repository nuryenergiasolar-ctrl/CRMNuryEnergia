import {
  STATUS_ABERTOS,
  diasParaPrazo,
  estaAtrasado,
  prazoProximo,
  type Orcamento,
} from "@/lib/orcamentos";

export type NotificacaoTipo = "atraso" | "prazo" | "urgente" | "rotina";

export type Notificacao = {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  descricao: string;
  data: Date;
  orcamentoId?: string;
};

const LIDAS_KEY = "nury:notificacoes-lidas";

export function lerLidas(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIDAS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function salvarLidas(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIDAS_KEY, JSON.stringify(ids.slice(-500)));
}

/** Rotinas fixas do mês, ligadas ao calendário. */
type Rotina = { chave: string; dia: number; titulo: string; descricao: string };

const ROTINAS: Rotina[] = [
  {
    chave: "inicio-revisao",
    dia: 1,
    titulo: "Início do mês: revisar fila de orçamentos",
    descricao:
      "Confira os pedidos abertos, redistribua responsáveis e defina prioridades do mês.",
  },
  {
    chave: "inicio-pendentes",
    dia: 3,
    titulo: "Início do mês: cobrar informações pendentes",
    descricao:
      "Retome os orçamentos em 'Aguardando informação' e cobre dados com os vendedores.",
  },
  {
    chave: "meio-followup",
    dia: 15,
    titulo: "Meio do mês: follow-up com vendedores",
    descricao:
      "Confirme com os vendedores o retorno dos orçamentos já enviados e atualize os status.",
  },
  {
    chave: "meio-atrasos",
    dia: 16,
    titulo: "Meio do mês: zerar atrasos",
    descricao: "Trate todos os orçamentos atrasados antes da segunda metade do mês.",
  },
  {
    chave: "fim-fechamento",
    dia: 26,
    titulo: "Fim do mês: fechamento",
    descricao:
      "Finalize os orçamentos prontos, arquive o que não avançou e feche os números do mês.",
  },
  {
    chave: "fim-relatorio",
    dia: 28,
    titulo: "Fim do mês: conferir histórico e relatório",
    descricao:
      "Revise o histórico de alterações e registre o resumo de orçamentos entregues no mês.",
  },
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Datas de rotina do mês corrente (usadas para marcar o calendário). */
export function rotinasDoMes(ref = new Date()) {
  const ultimoDia = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return ROTINAS.map((r) => ({
    ...r,
    data: new Date(ref.getFullYear(), ref.getMonth(), Math.min(r.dia, ultimoDia)),
  }));
}

export function construirNotificacoes(orcamentos: Orcamento[]): Notificacao[] {
  const agora = new Date();
  const lista: Notificacao[] = [];

  for (const o of orcamentos) {
    const dias = diasParaPrazo(o);
    if (estaAtrasado(o)) {
      lista.push({
        id: `atraso:${o.id}:${o.status}`,
        tipo: "atraso",
        titulo: `${o.numero} atrasado`,
        descricao: `${o.cliente} — ${Math.abs(dias ?? 0)} dia(s) de atraso. Responsável: ${
          o.responsavel ?? "sem responsável"
        }.`,
        data: agora,
        orcamentoId: o.id,
      });
      continue;
    }
    if (prazoProximo(o)) {
      lista.push({
        id: `prazo:${o.id}:${o.status}`,
        tipo: "prazo",
        titulo: `${o.numero} vence em ${dias} dia(s)`,
        descricao: `${o.cliente} — prazo próximo. Status atual: ${o.status}.`,
        data: agora,
        orcamentoId: o.id,
      });
      continue;
    }
    if (o.prioridade === "Urgente" && STATUS_ABERTOS.includes(o.status)) {
      lista.push({
        id: `urgente:${o.id}:${o.status}`,
        tipo: "urgente",
        titulo: `${o.numero} é urgente`,
        descricao: `${o.cliente} — prioridade urgente aguardando ação (${o.status}).`,
        data: agora,
        orcamentoId: o.id,
      });
    }
  }

  // Rotinas do calendário: aparecem a partir do dia previsto, dentro do mês.
  for (const r of rotinasDoMes(agora)) {
    if (agora >= r.data) {
      lista.push({
        id: `rotina:${ymd(r.data)}:${r.chave}`,
        tipo: "rotina",
        titulo: r.titulo,
        descricao: r.descricao,
        data: r.data,
      });
    }
  }

  const ordem: Record<NotificacaoTipo, number> = {
    atraso: 0,
    prazo: 1,
    urgente: 2,
    rotina: 3,
  };
  return lista.sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || +b.data - +a.data);
}

export const TIPO_LABEL: Record<NotificacaoTipo, string> = {
  atraso: "Atrasado",
  prazo: "Prazo próximo",
  urgente: "Urgente",
  rotina: "Rotina do mês",
};

export const TIPO_CLASSE: Record<NotificacaoTipo, string> = {
  atraso: "border-urgente/30 bg-urgente-soft text-urgente",
  prazo: "border-alta/30 bg-alta-soft text-alta",
  urgente: "border-urgente/30 bg-urgente-soft text-urgente",
  rotina: "border-info/30 bg-info-soft text-info",
};
