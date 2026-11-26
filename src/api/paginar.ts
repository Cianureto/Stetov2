/**
 * Todas as linhas de uma consulta, em blocos de 1.000 (o Supabase devolve no máximo 1.000 por vez).
 * Só para listas de opções e exportações; telas de lista usam `listarNoBanco`.
 */
export async function todasAsLinhas<L>(consulta: () => { range(de: number, ate: number): PromiseLike<{ data: L[] | null; error: unknown }> }, maximo = 20_000): Promise<L[]> {
  const BLOCO = 1000;
  const linhas: L[] = [];
  for (let de = 0; de < maximo; de += BLOCO) {
    const { data, error } = await consulta().range(de, de + BLOCO - 1);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if (!data || data.length < BLOCO) break;
  }
  return linhas;
}
