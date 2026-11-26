// Edge Function: ações que exigem a chave de serviço (nunca no navegador).
//  - criar_usuario: cria a conta com senha temporária (troca obrigatória no 1º acesso) e o perfil na empresa;
//  - redefinir_senha: nova senha temporária para um usuário da empresa;
//  - criar_empresa: (só administrador da Steto) empresa nova + o primeiro administrador dela.
// Quem chama precisa ser administrador ativo; o e-mail do Supabase não é usado (a senha aparece uma vez na tela).
import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resposta = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const erro = (status: number, mensagem: string) => resposta(status, { erro: mensagem });

function senhaTemporaria() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
  return `Steto-${s.slice(0, 6)}-${s.slice(6)}`;
}

const emailValido = (v: unknown): v is string => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length <= 200;
const textoValido = (v: unknown, max = 200): v is string => typeof v === "string" && v.trim().length >= 2 && v.length <= max;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return erro(405, "Método não permitido.");

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // Quem está chamando (o JWT já foi conferido pelo verify_jwt da função).
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: quem } = await admin.auth.getUser(token);
  if (!quem.user) return erro(401, "Sua sessão terminou. Entre de novo para continuar.");
  const { data: perfil } = await admin.from("perfis").select("papel, ativo, empresa_id, empresa:empresas(is_steto)").eq("id", quem.user.id).maybeSingle();
  if (!perfil || !perfil.ativo || perfil.papel !== "admin") return erro(403, "Só administradores gerenciam usuários.");
  const souSteto = !!(perfil.empresa as { is_steto?: boolean } | null)?.is_steto;

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return erro(400, "Requisição inválida.");
  }

  async function criarConta(email: string, nome: string, papel: "admin" | "usuario", empresaId: string) {
    const senha = senhaTemporaria();
    const emailNormal = email.trim().toLowerCase();
    // Já existe conta com o e-mail? Se tem perfil, é 409; se não, vincula e redefine a senha.
    const { data: existente } = await admin.from("perfis").select("id").eq("email", emailNormal).maybeSingle();
    if (existente) return { erro: erro(409, "Já existe um usuário com este e-mail.") };
    const criado = await admin.auth.admin.createUser({ email: emailNormal, password: senha, email_confirm: true, user_metadata: { nome } });
    let id = criado.data.user?.id;
    if (!id) {
      const lista = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const achado = lista.data.users.find((u) => u.email?.toLowerCase() === emailNormal);
      if (!achado) return { erro: erro(400, criado.error?.message ?? "Não foi possível criar a conta.") };
      id = achado.id;
      await admin.auth.admin.updateUserById(id, { password: senha });
    }
    const { error } = await admin.from("perfis").insert({ id, email: emailNormal, nome: nome.trim(), papel, empresa_id: empresaId, trocar_senha: true });
    if (error) return { erro: erro(400, "Não foi possível criar o perfil do usuário.") };
    return { id, senha };
  }

  switch (corpo.acao) {
    case "criar_usuario": {
      const { email, nome, papel } = corpo;
      const empresaId = typeof corpo.empresaId === "string" && souSteto ? corpo.empresaId : perfil.empresa_id;
      if (!emailValido(email)) return erro(400, "E-mail inválido.");
      if (!textoValido(nome)) return erro(400, "Informe o nome.");
      if (papel !== "admin" && papel !== "usuario") return erro(400, "Papel inválido.");
      const r = await criarConta(email, nome, papel, empresaId);
      if ("erro" in r) return r.erro;
      return resposta(200, { id: r.id, senhaTemporaria: r.senha });
    }
    case "redefinir_senha": {
      const alvo = corpo.usuarioId;
      if (typeof alvo !== "string") return erro(400, "Usuário inválido.");
      if (alvo === quem.user.id) return erro(400, "Para trocar a sua senha, use Meu perfil.");
      const { data: p } = await admin.from("perfis").select("empresa_id").eq("id", alvo).maybeSingle();
      if (!p || (!souSteto && p.empresa_id !== perfil.empresa_id)) return erro(404, "Usuário não encontrado.");
      const senha = senhaTemporaria();
      const r = await admin.auth.admin.updateUserById(alvo, { password: senha });
      if (r.error) return erro(400, "Não foi possível redefinir a senha.");
      await admin.from("perfis").update({ trocar_senha: true }).eq("id", alvo);
      return resposta(200, { senhaTemporaria: senha });
    }
    case "criar_empresa": {
      if (!souSteto) return erro(403, "Só o administrador da Steto cria empresas.");
      const { nome, cnpj, adminEmail, adminNome } = corpo;
      if (!textoValido(nome)) return erro(400, "Informe o nome da empresa.");
      if (!emailValido(adminEmail)) return erro(400, "E-mail do administrador inválido.");
      if (!textoValido(adminNome)) return erro(400, "Informe o nome do administrador.");
      const cnpjDigitos = typeof cnpj === "string" ? cnpj.replace(/\D/g, "") : "";
      const { data: empresa, error } = await admin.from("empresas").insert({ nome: nome.trim(), cnpj: cnpjDigitos || null }).select("id").single();
      if (error) return erro(400, "Não foi possível criar a empresa.");
      const r = await criarConta(adminEmail, adminNome, "admin", empresa.id);
      if ("erro" in r) {
        await admin.from("empresas").delete().eq("id", empresa.id);
        return r.erro;
      }
      return resposta(200, { empresaId: empresa.id, senhaTemporaria: r.senha });
    }
    default:
      return erro(400, "Ação desconhecida.");
  }
});
