import { rota } from "@/api/client";
import { supabase } from "@/api/supabase";
import type { OpcaoApi } from "@/api/types";
import { formatarDocumento } from "@/lib/format";

/** Empresas contábeis ativas para seletores. */
rota("GET", "/empresas-contabeis/opcoes", async (): Promise<OpcaoApi[]> => {
  const { data, error } = await supabase.from("empresas_contabeis").select("id, razao_social, nome_fantasia, cnpj").eq("status", "ativo").order("razao_social");
  if (error) throw error;
  return data.map((e) => ({ valor: e.id, rotulo: e.nome_fantasia || e.razao_social, descricao: formatarDocumento(e.cnpj) }));
});
