import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Papel = { admin: boolean; email: string | null };

export function usePapel() {
  const { data, isLoading } = useQuery<Papel>({
    queryKey: ["papel-usuario"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: usuario } = await supabase.auth.getUser();
      if (!usuario.user) return { admin: false, email: null };
      const { data: papeis } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", usuario.user.id);
      return {
        admin: (papeis ?? []).some((p) => p.role === "admin"),
        email: usuario.user.email ?? null,
      };
    },
  });

  const isAdmin = data?.admin ?? false;
  return {
    isAdmin,
    podeEditar: isAdmin,
    email: data?.email ?? null,
    carregando: isLoading,
  };
}
