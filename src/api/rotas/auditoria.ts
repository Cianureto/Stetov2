import { rota } from "@/api/client";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { EventoAuditoria, ListaAuditoria } from "@/api/types";
import { alteracoes, nomeDoAlvo } from "@/lib/auditoria";

type Linha = { id: number; created_at: string; usuario_email: string | null; tabela: string; registro_id: string | null; acao: EventoAuditoria["acao"]; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null };

const CAMPOS_AUDITORIA: Campos = {
  quando: { coluna: "created_at", tipo: "data", instante: true },
  usuarioEmail: { coluna: "usuario_email", tipo: "texto", busca: "texto" },
  tabela: { coluna: "tabela", tipo: "opcoes" },
  acao: { coluna: "acao", tipo: "opcoes" },
  registroId: { coluna: "registro_id", tipo: "texto", busca: "texto" },
};

/** Trilha de auditoria (só leitura; o RLS mostra apenas a da empresa do administrador). */
rota("GET", "/auditoria", async ({ query }): Promise<ListaAuditoria> => {
  const { itens, meta } = await listarNoBanco(() => supabase.from("auditoria").select("*", { count: "exact" }), lerConsulta(query, CAMPOS_AUDITORIA, "-quando"));
  return {
    eventos: (itens as unknown as Linha[]).map((l) => ({
      id: l.id, quando: l.created_at, usuarioEmail: l.usuario_email, tabela: l.tabela, registroId: l.registro_id, acao: l.acao,
      alvo: nomeDoAlvo(l.antes, l.depois), alteracoes: alteracoes(l.antes, l.depois),
    })),
    meta,
  };
});
