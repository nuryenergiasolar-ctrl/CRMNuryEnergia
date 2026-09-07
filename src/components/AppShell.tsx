import { Link, useNavigate } from "@tanstack/react-router";
import {
  KanbanSquare,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Inbox,
  Archive,
  Trash2,
  Zap,
  LogOut,
  Users,
  TrendingUp,
  Package,
  Settings,
  UserCog,
  CalendarClock,
  PieChart,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { NotificacoesBell } from "@/components/NotificacoesBell";
import { ConselhoIA } from "@/components/ConselhoIA";
import { supabase } from "@/integrations/supabase/client";
import { useConfig } from "@/lib/config";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/novo", label: "Novo orçamento", icon: PlusCircle },
  { to: "/pendentes", label: "Pendentes", icon: Inbox },
  { to: "/finalizados", label: "Fechados", icon: Archive },
  { to: "/cobrancas", label: "Cobranças", icon: Wallet },
  { to: "/arquivados", label: "Arquivados", icon: Trash2 },
] as const;

const NAV_COMERCIAL = [
  { to: "/comercial", label: "Painel comercial", icon: PieChart },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline (Kanban)", icon: KanbanSquare },
  { to: "/vendas", label: "Vendas", icon: TrendingUp },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/equipe", label: "Equipe", icon: UserCog },
  { to: "/followups", label: "Follow-ups", icon: CalendarClock },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;


export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [atualizando, setAtualizando] = useState(false);
  const { config } = useConfig();

  async function atualizar() {
    setAtualizando(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setAtualizando(false);
    }
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight">{config.empresa_nome}</p>
            <p className="text-[11px] text-sidebar-foreground/60">{config.empresa_subtitulo}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="flex flex-col gap-1">
            <span className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-sidebar-foreground/50">
              Orçamentos
            </span>
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner",
                }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <nav className="mt-6 flex flex-col gap-1">
            <span className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-sidebar-foreground/50">
              Comercial / CRM
            </span>
            {NAV_COMERCIAL.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner",
                }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={atualizar}
              title="Atualizar dados da página"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <RefreshCw className={`size-4 ${atualizando ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70">
              <NotificacoesBell />
              <span>Notificações</span>
            </div>
            <button
              type="button"
              onClick={sair}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-6 pb-24 pt-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>

      <ConselhoIA tela={title} />
    </div>
  );
}
