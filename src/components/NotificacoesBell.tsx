import { useState } from "react";
import { Bell, Check, RotateCcw } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { TIPO_CLASSE, TIPO_LABEL } from "@/lib/notificacoes";
import { cn } from "@/lib/utils";

export function NotificacoesBell() {
  const [aba, setAba] = useState<"pendentes" | "concluidas">("pendentes");
  const { pendentes, concluidas, marcarLida, desmarcar, marcarTodas } = useNotificacoes();

  const lista = aba === "pendentes" ? pendentes : concluidas;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-md text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Bell className="size-[18px]" />
          {pendentes.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-urgente px-1 text-[10px] font-bold leading-4 text-white">
              {pendentes.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-bold">Notificações</p>
          {aba === "pendentes" && pendentes.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={marcarTodas} className="h-7 text-xs">
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>
        <div className="flex gap-1 border-b border-border px-2 py-1.5">
          {(["pendentes", "concluidas"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setAba(k)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                aba === k
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              {k === "pendentes"
                ? `Pendentes (${pendentes.length})`
                : `Concluídas (${concluidas.length})`}
            </button>
          ))}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {lista.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {aba === "pendentes"
                ? "Nenhuma notificação pendente. Tudo em ordem."
                : "Nenhuma notificação concluída ainda."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lista.map((n) => (
                <li key={n.id} className="flex gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        TIPO_CLASSE[n.tipo],
                      )}
                    >
                      {TIPO_LABEL[n.tipo]}
                    </span>
                    <p className="mt-1 text-sm font-semibold leading-snug">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground">{n.descricao}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    title={aba === "pendentes" ? "Marcar como lida/concluída" : "Reabrir"}
                    onClick={() => (aba === "pendentes" ? marcarLida(n) : desmarcar(n))}
                  >
                    {aba === "pendentes" ? (
                      <Check className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
