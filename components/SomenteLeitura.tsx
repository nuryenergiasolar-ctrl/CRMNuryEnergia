import { Eye } from "lucide-react";

export function SomenteLeitura({ texto }: { texto?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
      <Eye className="mt-0.5 size-4 shrink-0" />
      <span>
        {texto ??
          "Acesso somente leitura: apenas administradores podem cadastrar, editar ou arquivar."}
      </span>
    </div>
  );
}
