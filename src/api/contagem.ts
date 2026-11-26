import { supabase } from "@/api/supabase";
import type { Database } from "@/lib/database.types";

type Tabela = keyof Database["public"]["Tables"];

/**
 * Quantas linhas a tabela tem (com um recorte opcional), sem baixá-las: `count: "exact"` + `head`. Use nos totais
 * dos cabeçalhos — buscar as linhas para contar no navegador para em 1.000 (limite do Supabase).
 */
export async function contar(tabela: Tabela, recorte?: (q: any) => any): Promise<number> {
  let q = supabase.from(tabela).select("*", { count: "exact", head: true });
  if (recorte) q = recorte(q);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}
