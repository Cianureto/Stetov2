// Cliente da "API" do app. Mesma interface do ConectaPRO (api.get/post/patch/put/delete, ApiError,
// quandoSessaoEncerrar), mas o Steto não tem servidor próprio: cada rota é uma função local (src/api/rotas)
// que consulta o Supabase. Quem decide o acesso é o banco (RLS); as rotas validam a entrada com Zod e
// traduzem os erros do Postgres para mensagens em português.

export class ApiError extends Error {
  status?: number;
  corpo?: unknown;
}

export function erroHttp(status: number, mensagem: string, corpo?: unknown) {
  const e = new ApiError(mensagem);
  e.status = status;
  e.corpo = corpo;
  return e;
}

type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type Requisicao = { params: Record<string, string>; query: URLSearchParams; corpo: unknown };
type Tratador = (req: Requisicao) => Promise<unknown>;
type Rota = { metodo: Metodo; padrao: RegExp; chaves: string[]; tratador: Tratador };

const rotas: Rota[] = [];

/** Registra uma rota ("/clientes/:id"). Os arquivos de src/api/rotas chamam isto ao serem importados. */
export function rota(metodo: Metodo, caminho: string, tratador: Tratador) {
  const chaves: string[] = [];
  const padrao = new RegExp(`^${caminho.replace(/:(\w+)/g, (_, k: string) => (chaves.push(k), "([^/]+)"))}$`);
  rotas.push({ metodo, padrao, chaves, tratador });
}

// Avisado quando o Supabase recusa a sessão (JWT vencido ou inválido). O AuthContext leva para o login.
let aoEncerrarSessao: (() => void) | null = null;
export function quandoSessaoEncerrar(ouvinte: () => void) {
  aoEncerrarSessao = ouvinte;
  return () => {
    if (aoEncerrarSessao === ouvinte) aoEncerrarSessao = null;
  };
}

type ErroPostgres = { code?: string; message?: string; details?: string };

/** Erro do Supabase/Postgres → ApiError com mensagem para o usuário. Rede caída continua TypeError. */
export function traduzirErro(e: unknown): unknown {
  if (e instanceof ApiError || e instanceof TypeError) return e;
  const { code, message } = (e ?? {}) as ErroPostgres;
  if (code === "PGRST301" || code === "PGRST303" || /JWT/i.test(message ?? "")) {
    aoEncerrarSessao?.();
    return erroHttp(401, "Sua sessão terminou. Entre de novo para continuar.");
  }
  if (code === "42501") return erroHttp(403, "Você não tem permissão para esta ação.");
  // Mensagens escritas para a pessoa pelas funções do banco (validação, regra, limite de pedidos).
  if (code === "P0429") return erroHttp(429, message ?? "Muitas tentativas. Tente de novo mais tarde.");
  if ((code === "22023" || code === "P0001") && message) return erroHttp(400, message);
  if (code === "23505") return erroHttp(409, "Já existe um cadastro com estes dados.", e);
  if (code === "23503") return erroHttp(409, "Este registro está em uso em outra parte do sistema.", e);
  if (code === "PGRST116") return erroHttp(404, "Registro não encontrado.");
  if (code === "22P02") return erroHttp(400, "Dado em formato inválido.");
  if (code === "PGRST202") return erroHttp(501, "O banco ainda não tem esta função. Aplique as migrations pendentes.");
  console.error("Erro do banco", e);
  return erroHttp(500, "Não foi possível concluir a ação.", e);
}

async function request<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
  const url = new URL(caminho, "http://steto.local");
  const alvo = rotas.find((r) => r.metodo === metodo && r.padrao.test(url.pathname));
  if (!alvo) throw erroHttp(404, `Rota inexistente: ${metodo} ${url.pathname}`);
  const valores = alvo.padrao.exec(url.pathname)!.slice(1).map(decodeURIComponent);
  const params = Object.fromEntries(alvo.chaves.map((k, i) => [k, valores[i]]));
  try {
    return (await alvo.tratador({ params, query: url.searchParams, corpo })) as T;
  } catch (e) {
    throw traduzirErro(e);
  }
}

export const api = {
  get: <T>(caminho: string) => request<T>("GET", caminho),
  post: <T>(caminho: string, corpo?: unknown) => request<T>("POST", caminho, corpo),
  patch: <T>(caminho: string, corpo?: unknown) => request<T>("PATCH", caminho, corpo),
  put: <T>(caminho: string, corpo?: unknown) => request<T>("PUT", caminho, corpo),
  delete: <T>(caminho: string) => request<T>("DELETE", caminho),
};
