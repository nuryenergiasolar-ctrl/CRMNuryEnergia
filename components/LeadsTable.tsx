import { MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  ETAPAS,
  ETAPA_COR,
  TEMPERATURAS,
  TEMPERATURA_COR,
  TEMPERATURA_ICON,
  diasEntre,
  diasSemContato,
  faixaTicket,
  linkWhatsApp,
  moeda,
  type Lead,
} from "@/lib/leads";
import { useConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm";

export function LeadsTable({
  leads,
  onSelecionar,
  arquivados = false,
  ocultarTemperatura = false,
}: {
  leads: Lead[];
  onSelecionar: (lead: Lead) => void;
  arquivados?: boolean;
  ocultarTemperatura?: boolean;
}) {
  const { config } = useConfig();
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState("");
  const [origem, setOrigem] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [tipo, setTipo] = useState("");

  const vendedores = useMemo(
    () => [...new Set(leads.map((l) => l.vendedor).filter(Boolean))] as string[],
    [leads],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (etapa && l.etapa !== etapa) return false;
      if (origem && l.origem !== origem) return false;
      if (temperatura && l.temperatura !== temperatura) return false;
      if (vendedor && l.vendedor !== vendedor) return false;
      if (tipo && l.tipo !== tipo) return false;
      if (!termo) return true;
      return [
        l.nome,
        l.telefone,
        l.email,
        l.cidade,
        l.endereco,
        l.produto,
        l.vendedor,
        l.campanha,
        l.tipo,
      ]
        .concat(new Date(l.data_entrada).toLocaleDateString("pt-BR"))
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termo));
    });
  }, [leads, busca, etapa, origem, temperatura, vendedor, tipo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nome, telefone, cidade, produto…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-9 max-w-xs"
        />
        <select className={selectClass} value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="">Todas as etapas</option>
          {ETAPAS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <select className={selectClass} value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="">Todas as origens</option>
          {config.lead_origens.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select className={selectClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {config.lead_tipos.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {ocultarTemperatura ? null : (
          <select
            className={selectClass}
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value)}
          >
            <option value="">Todas as temperaturas</option>
            {TEMPERATURAS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        <select
          className={selectClass}
          value={vendedor}
          onChange={(e) => setVendedor(e.target.value)}
        >
          <option value="">Todos os vendedores</option>
          {vendedores.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtrados.length} de {leads.length} leads
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Lead</th>
              <th className="px-3 py-2 text-left">Chegou</th>
              <th className="px-3 py-2 text-left">Telefone</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              {ocultarTemperatura ? null : (
                <th className="px-3 py-2 text-left">Temperatura</th>
              )}
              <th className="px-3 py-2 text-left">Produto</th>
              <th className="px-3 py-2 text-left">Vendedor</th>
              <th className="px-3 py-2 text-left">Etapa</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-left">Ticket</th>
              <th className="px-3 py-2 text-right">
                {arquivados ? "Arquivado" : "Dias / contato"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td
                  colSpan={ocultarTemperatura ? 11 : 12}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  Nenhum lead encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((l) => {
                const wa = linkWhatsApp(l.telefone);
                const parado = !arquivados && diasSemContato(l) > 3;
                return (
                  <tr
                    key={l.id}
                    onClick={() => onSelecionar(l)}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold text-foreground">{l.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.cidade ?? "—"}
                        {l.motivo_perda ? ` · ${l.motivo_perda}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(l.data_entrada).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        {l.telefone ?? "—"}
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{l.origem}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.tipo}</td>
                    {ocultarTemperatura ? null : (
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            TEMPERATURA_COR[l.temperatura],
                          )}
                        >
                          {TEMPERATURA_ICON[l.temperatura]} {l.temperatura}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-muted-foreground">{l.produto ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.vendedor ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          ETAPA_COR[l.etapa],
                        )}
                      >
                        {l.etapa}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {l.valor ? moeda(Number(l.valor)) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {faixaTicket(l.valor ? Number(l.valor) : null)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {arquivados ? (
                        <span className="text-muted-foreground">
                          {l.arquivado_em
                            ? new Date(l.arquivado_em).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      ) : (
                        <span className={cn(parado && "font-semibold text-destructive")}>
                          {diasEntre(l.data_entrada, null)}d · {diasSemContato(l)}d s/ contato
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
