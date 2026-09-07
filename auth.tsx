import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Controle de Orçamentos Nury Energia" },
      {
        name: "description",
        content:
          "Acesso restrito à equipe da Nury Energia para o sistema de controle de orçamentos.",
      },
      { property: "og:title", content: "Entrar | Controle de Orçamentos Nury Energia" },
      {
        property: "og:description",
        content: "Área restrita: entre com seu e-mail e senha para acessar os orçamentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada. Confirme o e-mail para entrar.");
          setModo("entrar");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight text-foreground">NURY ENERGIA</p>
            <p className="text-[11px] text-muted-foreground">Controle de Orçamentos</p>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso restrito à equipe. Os dados dos clientes só ficam visíveis após o login.
        </p>

        <form onSubmit={submeter} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
