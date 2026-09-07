import { Check, CalendarDays } from "lucide-react";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { TIPO_CLASSE, TIPO_LABEL, rotinasDoMes } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

export function CaixaNotificacoes() {
  const { pendentes, concluidas, marcarLida, marcarTodas } = useNotificacoes();
  const rotinas = rotinasDoMes();
  const hoje = new Date();

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Caixa de notificações{" "}
            <span className="text-muted-foreground">({pendentes.length} pendentes)</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {concluidas.length} concluídas
            </span>
            {pendentes.length > 0 ? (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={marcarTodas}>
                Concluir todas
              </Button>
            ) : null}
          </div>
        </div>
        <div className="max-h-[330px] overflow-y-auto">
          {pendentes.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Nenhum lembrete pendente. Todas as notificações estão lidas/concluídas.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pendentes.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      TIPO_CLASSE[n.tipo],
                    )}
                  >
                    {TIPO_LABEL[n.tipo]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground">{n.descricao}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 gap-1 text-xs"
                    onClick={() => marcarLida(n)}
                  >
                    <Check className="size-3.5" /> Concluir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
          <CalendarDays className="size-4" /> Calendário de rotinas
        </p>
        <Calendar
          locale={ptBR}
          mode="single"
          selected={hoje}
          month={hoje}
          modifiers={{ rotina: rotinas.map((r) => r.data) }}
          modifiersClassNames={{
            rotina: "border border-info/60 text-info font-bold rounded-md",
          }}
          className="p-0"
        />
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {rotinas.map((r) => (
            <li key={r.chave} className="flex gap-2 text-xs">
              <span className="w-8 shrink-0 font-mono font-semibold text-muted-foreground">
                {String(r.data.getDate()).padStart(2, "0")}/
                {String(r.data.getMonth() + 1).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground">{r.titulo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
