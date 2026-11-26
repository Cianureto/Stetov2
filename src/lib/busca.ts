/** Texto para comparação em buscas: minúsculo, sem acento e sem espaços nas pontas ("José " → "jose"). */
export function normalizarBusca(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Opção de um seletor. `descricao` aparece em segunda linha e também entra na busca (ex.: a clínica do médico). */
export type OpcaoSeletor = { valor: string; rotulo: string; descricao?: string; desabilitada?: boolean };

/** Opções cujo rótulo ou descrição contém o termo, sem diferenciar acento nem maiúscula. Termo vazio: todas. */
export function filtrarOpcoes<T extends Pick<OpcaoSeletor, "rotulo" | "descricao">>(opcoes: T[], termo: string): T[] {
  const busca = normalizarBusca(termo);
  if (!busca) return opcoes;
  return opcoes.filter((opcao) => normalizarBusca(`${opcao.rotulo} ${opcao.descricao ?? ""}`).includes(busca));
}

/** Atalho para listas simples de textos, em que o valor é o próprio rótulo (UFs, motivos, produtos). */
export const opcoesDeTextos = (textos: readonly string[]): OpcaoSeletor[] => textos.map((texto) => ({ valor: texto, rotulo: texto }));
