import { PRIORIDADE_ICON, STATUS_ICON } from "@/lib/orcamentos";
import { cn } from "@/lib/utils";

const PRIORIDADE_CLASS: Record<string, string> = {
  Urgente: "bg-urgente-soft text-urgente border-urgente/30",
  Alta: "bg-alta-soft text-alta border-alta/30",
  Normal: "bg-normal-soft text-normal border-normal/30",
};

const STATUS_CLASS: Record<string, string> = {
  "Novo/Pendente": "bg-info-soft text-info border-info/25",
  "Em orçamento": "bg-secondary text-secondary-foreground border-border",
  "Aguardando informação": "bg-alta-soft text-alta border-alta/25",
  Pronto: "bg-normal-soft text-normal border-normal/25",
  "Enviado ao vendedor": "bg-info-soft text-info border-info/25",
  Fechado: "bg-normal-soft text-normal border-normal/40",
  Finalizado: "bg-normal-soft text-normal border-normal/40",
  Cancelado: "bg-muted text-muted-foreground border-border line-through",
};

const base =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold";

export function PrioridadeBadge({ value }: { value: string }) {
  return (
    <span className={cn(base, PRIORIDADE_CLASS[value] ?? PRIORIDADE_CLASS['Normal'])}>
      <span aria-hidden>{PRIORIDADE_ICON[value]}</span>
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn(base, STATUS_CLASS[value] ?? "bg-muted text-muted-foreground")}>
      <span aria-hidden>{STATUS_ICON[value]}</span>
      {value}
    </span>
  );
}

export function AtrasoBadge({ dias }: { dias: number }) {
  return (
    <span className={cn(base, "bg-urgente-soft text-urgente border-urgente/30")}>
      Atrasado {Math.abs(dias)}d
    </span>
  );
}

export function ProximoBadge({ dias }: { dias: number }) {
  return (
    <span className={cn(base, "bg-alta-soft text-alta border-alta/30")}>
      {dias === 0 ? "Vence hoje" : `Vence em ${dias}d`}
    </span>
  );
}
