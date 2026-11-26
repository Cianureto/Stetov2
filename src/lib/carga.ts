/** O que o `useDadosApi` devolve (o EstadoCarga recebe o objeto inteiro). */
export type Carga<T> = { dados: T | null; erro: string | null; carregando: boolean; recarregar: () => void };

/**
 * Junta várias cargas numa só (ex.: visitas + ausências da mesma tela): só "tem dados" quando todas
 * têm, carrega se qualquer uma carrega, mostra o primeiro erro e `recarregar` recarrega todas.
 */
export function combinarCargas(...cargas: Carga<unknown>[]): Carga<true> {
  return {
    dados: cargas.every((c) => c.dados !== null) ? true : null,
    erro: cargas.find((c) => c.erro)?.erro ?? null,
    carregando: cargas.some((c) => c.carregando),
    recarregar: () => cargas.forEach((c) => c.recarregar()),
  };
}
