// Rótulos e leitura dos eventos da trilha de auditoria (tabela auditoria, gravada por gatilho no banco).

export const ROTULO_TABELA: Record<string, string> = {
  empresas: "Empresa",
  perfis: "Usuário",
  empresas_contabeis: "Empresa contábil",
  clientes: "Cliente",
  prestadores: "Prestador",
  prestador_clientes: "Vínculo prestador–cliente",
  prestador_empresas_contabeis: "Vínculo prestador–empresa contábil",
  registros_financeiros: "Registro financeiro",
  categorias_contas: "Categoria de conta",
  subcategorias_contas: "Subcategoria de conta",
  contas: "Conta",
};

export const ROTULO_ACAO = { criou: "Criou", alterou: "Alterou", excluiu: "Excluiu" } as const;

/** Campos que não interessam a quem lê (técnicos ou repetidos). */
const IGNORADOS = new Set(["id", "empresa_id", "created_at", "updated_at", "legacy_id", "cadastro_completo", "importacao_id"]);

type Linha = Record<string, unknown> | null;

/** Nome legível do registro a partir da linha gravada. */
export function nomeDoAlvo(antes: Linha, depois: Linha): string {
  const l = depois ?? antes ?? {};
  const valor = l.razao_social ?? l.nome_completo ?? l.descricao ?? l.nome ?? l.email ?? l.numero_nfs;
  return typeof valor === "string" && valor ? valor : "—";
}

/** Campos que mudaram (numa alteração) ou os preenchidos (criação/exclusão), sem os técnicos. */
export function alteracoes(antes: Linha, depois: Linha): { campo: string; antes: unknown; depois: unknown }[] {
  const chaves = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]);
  const saida: { campo: string; antes: unknown; depois: unknown }[] = [];
  for (const campo of chaves) {
    if (IGNORADOS.has(campo)) continue;
    const a = antes?.[campo] ?? null;
    const d = depois?.[campo] ?? null;
    if (JSON.stringify(a) === JSON.stringify(d)) continue;
    if (a === null && d === null) continue;
    saida.push({ campo, antes: a, depois: d });
  }
  return saida;
}

/** "razao_social" → "Razao social" (rótulo legível sem dicionário). */
export const rotuloCampo = (campo: string) => (campo.charAt(0).toUpperCase() + campo.slice(1)).replace(/_/g, " ");
