import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { PERIODOS, type Periodo } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const CORES_GRAFICO = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function PeriodoFiltro({
  valor,
  onChange,
}: {
  valor: Periodo;
  onChange: (p: Periodo) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
      {PERIODOS.map((p) => (
        <button
          key={p.valor}
          type="button"
          onClick={() => onChange(p.valor)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted",
            valor === p.valor && "bg-primary text-primary-foreground hover:bg-primary",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function Kpi({
  label,
  valor,
  detalhe,
  destaque,
  restrito,
}: {
  label: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  destaque?: boolean;
  restrito?: boolean;
  verDetalhes?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm",
        destaque && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {restrito ? (
          <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <Lock className="size-3" /> Admin
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export function Painel({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  verDetalhes?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">{titulo}</h2>
          {descricao ? (
            <p className="text-xs text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">{acoes}</div>
      </header>
      {children}
    </section>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{texto}</p>
  );
}
