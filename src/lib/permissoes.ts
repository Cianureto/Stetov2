// Permissões (RBAC): catálogo único agrupado por módulo, no modelo do ConectaPRO. Quem decide é o banco
// (RLS); aqui só servem para esconder o que o perfil não permite. Administrador (sem lista) = acesso total.

export type Permissao =
  | "painel.ver"
  | "clientes.gerenciar"
  | "prestadores.gerenciar"
  | "empresas_contabeis.gerenciar"
  | "registros.ver"
  | "registros.gerenciar"
  | "contas.ver"
  | "contas.gerenciar"
  | "relatorios.ver"
  | "importacao.executar"
  | "acessos.gerenciar"
  | "auditoria.ver"
  | "empresas.gerenciar";

/** Mantido com o nome do ConectaPRO: no Steto não há permissões de escopo próprio. */
export type PermissaoQualquer = Permissao;

export const CATALOGO: { modulo: string; permissoes: { chave: Permissao; rotulo: string }[] }[] = [
  { modulo: "Acompanhamento", permissoes: [{ chave: "painel.ver", rotulo: "Ver a visão geral" }, { chave: "relatorios.ver", rotulo: "Ver e exportar relatórios" }] },
  {
    modulo: "Cadastros",
    permissoes: [
      { chave: "clientes.gerenciar", rotulo: "Gerenciar clientes" },
      { chave: "prestadores.gerenciar", rotulo: "Gerenciar prestadores" },
      { chave: "empresas_contabeis.gerenciar", rotulo: "Gerenciar empresas contábeis" },
    ],
  },
  {
    modulo: "Financeiro",
    permissoes: [
      { chave: "registros.ver", rotulo: "Ver registros financeiros" },
      { chave: "registros.gerenciar", rotulo: "Lançar e editar registros financeiros" },
      { chave: "contas.ver", rotulo: "Ver contas a pagar e receber" },
      { chave: "contas.gerenciar", rotulo: "Lançar e editar contas" },
    ],
  },
  {
    modulo: "Administração",
    permissoes: [
      { chave: "importacao.executar", rotulo: "Importar planilhas e XML" },
      { chave: "acessos.gerenciar", rotulo: "Gerenciar usuários e acessos" },
      { chave: "auditoria.ver", rotulo: "Ver a auditoria" },
      { chave: "empresas.gerenciar", rotulo: "Gerenciar empresas (só Steto)" },
    ],
  },
];

/** O que um usuário comum faz (até existirem perfis de acesso configuráveis). */
export const PERMISSOES_USUARIO: Permissao[] = [
  "painel.ver",
  "clientes.gerenciar",
  "prestadores.gerenciar",
  "empresas_contabeis.gerenciar",
  "registros.ver",
  "registros.gerenciar",
  "contas.ver",
  "contas.gerenciar",
  "relatorios.ver",
];

type UsuarioComPermissoes = { papel: "admin" | "usuario"; empresa?: { isSteto: boolean }; permissoes?: string[] } | null;

/** O usuário pode? Administrador pode tudo, menos gerenciar empresas, que é só do administrador da Steto. */
export function pode(usuario: UsuarioComPermissoes, permissao: PermissaoQualquer) {
  if (!usuario) return false;
  if (permissao === "empresas.gerenciar") return usuario.papel === "admin" && !!usuario.empresa?.isSteto;
  return usuario.permissoes === undefined || usuario.permissoes.includes(permissao);
}

/** Permissões efetivas pelo papel (administrador: sem lista = tudo). */
export const permissoesDoPapel = (papel: "admin" | "usuario"): string[] | undefined => (papel === "admin" ? undefined : PERMISSOES_USUARIO);

/** Primeira tela de quem entra. */
export function inicioDoUsuario(usuario: UsuarioComPermissoes) {
  return pode(usuario, "painel.ver") ? "/painel" : "/clientes";
}
