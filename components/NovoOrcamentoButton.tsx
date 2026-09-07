import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { usePapel } from "@/lib/usePapel";

export function NovoOrcamentoButton() {
  const { podeEditar } = usePapel();
  if (!podeEditar) return null;
  return (
    <Link
      to="/novo"
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      <Plus className="size-4" />
      Novo orçamento
    </Link>
  );
}
