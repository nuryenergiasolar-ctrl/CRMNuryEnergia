import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Meta = Database["public"]["Tables"]["metas"]["Row"];
export type NovaMeta = Database["public"]["Tables"]["metas"]["Insert"];

export const TIPOS_META = [
  { valor: "faturamento", label: "Faturamento (R$)" },
  { valor: "vendas", label: "Vendas fechadas" },
  { valor: "leads", label: "Leads recebidos" },
] as const;

export type TipoMeta = (typeof TIPOS_META)[number]["valor"];

export function labelTipoMeta(tipo: string): string {
  return TIPOS_META.find((t) => t.valor === tipo)?.label ?? tipo;
}

export async function listarMetas(): Promise<Meta[]> {
  const { data, error } = await supabase
    .from("metas")
    .select("*")
    .order("periodo_inicio", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function salvarMeta(meta: NovaMeta & { id?: string }): Promise<void> {
  if (meta.id) {
    const { id, ...patch } = meta;
    const { error } = await supabase.from("metas").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("metas").insert(meta);
  if (error) throw error;
}

export async function excluirMeta(id: string): Promise<void> {
  const { error } = await supabase.from("metas").delete().eq("id", id);
  if (error) throw error;
}
