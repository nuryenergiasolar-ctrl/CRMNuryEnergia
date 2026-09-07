import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AtrasoBadge, PrioridadeBadge, ProximoBadge, StatusBadge } from "@/components/Badges";
import {
  PRIORIDADES,
  STATUS,
  diasAberto,
  diasParaPrazo,
  estaAtrasado,
  formatData,
  prazoProximo,
  type Orcamento,
} from "@/lib/orcamentos";
import { cn } from "@/lib/utils";

const TODOS = "__todos__";

export function OrcamentosTable({
  orcamentos,
  onSelect,
  showFilters = true,
  empty = "Nenhum orçamento encontrado.",
}: {
  orcamentos: Orcamento[];
  onSelect: (o: Orcamento) => void;
  showFilters?: boolean;
  empty?: string;
}) {
  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState(TODOS);
  const [vendedor, setVendedor] = useState(TODOS);
  const [responsavel, setResponsavel] = useState(TODOS);
  const [prioridade, setPrioridade] = useState(TODOS);
  const [status, setStatus] = useState(TODOS);

  const opts = useMemo(
    () => ({
      clientes: unique(orcamentos.map((o) => o.cliente)),
      vendedores: unique(orcamentos.map((o) => o.vendedor)),
      responsaveis: unique(orcamentos.map((o) => o.responsavel ?? "")),
    }),
    [orcamentos],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return orcamentos.filter((o) => {
      if (cliente !== TODOS && o.cliente !== cliente) return false;
      if (vendedor !== TODOS && o.vendedor !== vendedor) return false;
      if (responsavel !== TODOS && (o.responsavel ?? "") !== responsavel) return false;
      if (prioridade !== TODOS && o.prioridade !== prioridade) return false;
      if (status !== TODOS && o.status !== status) return false;
      if (!q) return true;
      return [
        o.numero,
        o.cliente,
        o.telefone,
        o.endereco,
        o.vendedor,
        o.tipo,
        o.responsavel,
        o.observacoes,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orcamentos, busca, cliente, vendedor, responsavel, prioridade, status]);

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <div className="relative xl:col-span-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Pesquisar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Filtro label="Cliente" value={cliente} onChange={setCliente} options={opts.clientes} />
            <Filtro label="Vendedor" value={vendedor} onChange={setVendedor} options={opts.vendedores} />
            <Filtro
              label="Responsável"
              value={responsavel}
              onChange={setResponsavel}
              options={opts.responsaveis}
            />
            <Filtro
              label="Prioridade"
              value={prioridade}
              onChange={setPrioridade}
              options={[...PRIORIDADES]}
            />
            <Filtro label="Status" value={status} onChange={setStatus} options={[...STATUS]} />
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1150px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {[
                "Nº",
                "Pedido",
                "Cliente",
                "Telefone",
                "Endereço",
                "Vendedor",
                "Tipo",
                "Prioridade",
                "Prazo",
                "Responsável",
                "Status",
                "Aberto",
                "Conclusão",
                "Observações",
              ].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-10 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              filtrados.map((o) => {
                const dias = diasParaPrazo(o);
                const atrasado = estaAtrasado(o);
                return (
                  <tr
                    key={o.id}
                    onClick={() => onSelect(o)}
                    className={cn(
                      "cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40",
                      o.prioridade === "Urgente" && "bg-urgente-soft/50",
                      atrasado && "bg-urgente-soft/70",
                    )}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{o.numero}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatData(o.data_pedido)}</td>
                    <td className="px-3 py-2.5 font-medium">{o.cliente}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
                      {o.telefone ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 text-muted-foreground">
                      {o.endereco ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">{o.vendedor}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{o.tipo}</td>
                    <td className="px-3 py-2.5">
                      <PrioridadeBadge value={o.prioridade} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span>{formatData(o.prazo)}</span>
                        {atrasado && dias !== null ? (
                          <AtrasoBadge dias={dias} />
                        ) : prazoProximo(o) && dias !== null ? (
                          <ProximoBadge dias={dias} />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{o.responsavel ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{diasAberto(o)}d</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {formatData(o.data_conclusao)}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2.5 text-muted-foreground">
                      {o.observacoes ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtrados.length} de {orcamentos.length} orçamento(s) — clique numa linha para editar.
      </p>
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter((v) => v && v.trim()))].sort((a, b) => a.localeCompare(b));
}

function Filtro({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{label}: todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
