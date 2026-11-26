import { erroHttp, rota } from "@/api/client";
import { supabase } from "@/api/supabase";
import type { Usuario } from "@/context/useAuth";
import { permissoesDoPapel } from "@/lib/permissoes";

/** Usuário logado com empresa e permissões. 404 = logado, mas sem perfil (conta não vinculada). */
rota("GET", "/auth/me", async () => {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw erroHttp(401, "Sua sessão terminou. Entre de novo para continuar.");
  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, email, papel, empresa:empresas(id, nome, is_steto)")
    .eq("id", sessao.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.empresa) throw erroHttp(404, "Sua conta ainda não está vinculada a uma empresa.");
  const usuario: Usuario = {
    id: data.id,
    nome: data.nome || data.email,
    email: data.email,
    papel: data.papel,
    empresa: { id: data.empresa.id, nome: data.empresa.nome, isSteto: data.empresa.is_steto },
    permissoes: permissoesDoPapel(data.papel),
  };
  return usuario;
});
