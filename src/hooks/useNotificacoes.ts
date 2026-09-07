import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listarOrcamentos } from "@/lib/orcamentos";
import {
  construirNotificacoes,
  lerLidas,
  salvarLidas,
  type Notificacao,
} from "@/lib/notificacoes";

const listeners = new Set<(ids: string[]) => void>();
let lidasCache: string[] | null = null;

function getLidas() {
  if (lidasCache === null) lidasCache = lerLidas();
  return lidasCache;
}

function setLidas(ids: string[]) {
  lidasCache = ids;
  salvarLidas(ids);
  listeners.forEach((fn) => fn(ids));
}

export function useNotificacoes() {
  const { data: orcamentos = [] } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: listarOrcamentos,
  });

  const [lidas, setLidasState] = useState<string[]>([]);

  useEffect(() => {
    setLidasState(getLidas());
    const fn = (ids: string[]) => setLidasState(ids);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const todas = useMemo(() => construirNotificacoes(orcamentos), [orcamentos]);
  const pendentes = useMemo(
    () => todas.filter((n) => !lidas.includes(n.id)),
    [todas, lidas],
  );
  const concluidas = useMemo(
    () => todas.filter((n) => lidas.includes(n.id)),
    [todas, lidas],
  );

  const marcarLida = useCallback((n: Notificacao) => {
    const atual = getLidas();
    if (!atual.includes(n.id)) setLidas([...atual, n.id]);
  }, []);

  const desmarcar = useCallback((n: Notificacao) => {
    setLidas(getLidas().filter((id) => id !== n.id));
  }, []);

  const marcarTodas = useCallback(() => {
    const atual = getLidas();
    const novos = todas.map((n) => n.id).filter((id) => !atual.includes(id));
    if (novos.length) setLidas([...atual, ...novos]);
  }, [todas]);

  return { todas, pendentes, concluidas, marcarLida, desmarcar, marcarTodas };
}
