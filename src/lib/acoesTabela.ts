import type { ComponentType } from "react";
import { api } from "@/api/client";
import type { PermissaoQualquer } from "@/lib/permissoes";

// Ações das tabelas (padrão): a mesma definição serve para o botão na linha e para a ação em massa sobre
// as linhas selecionadas. Cada ação declara a permissão (RBAC) que a libera — sem ela, não aparece — e chama
// a rota `POST …/em-massa` do recurso (`api/src/lib/emMassa.ts`), que aplica as regras item a item.
//
//   const acoes = useAcoesTabela({ acoes: ACOES, chave: (u) => u.id, nome: (u) => u.nome, aoConcluir: recarregar });
//   <TabelaDados … acoes={acoes} />            // caixas de seleção + barra de ações em massa
//   <AcoesEmLinha controle={acoes} linha={u} />  // os mesmos botões, na linha

export type ResultadoEmMassa = { feitos: number; falhas: { id: string; erro: string }[] };

export type AcaoTabela<T> = {
  chave: string;
  /** Verbo curto do botão: "Inativar". */
  rotulo: string;
  Icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Ação destrutiva (botão em vermelho). */
  perigo?: boolean;
  /** Permissão que libera a ação (catálogo do gestor ou do consultor). */
  permissao: PermissaoQualquer;
  /** Em quais linhas a ação faz sentido (ex.: "Inativar" só nas ativas). Padrão: todas. */
  aplicavel?: (linha: T) => boolean;
  /** Pede confirmação antes (ações destrutivas ou de efeito imediato sobre pessoas). */
  confirmar?: (linhas: T[]) => { titulo: string; descricao?: string; acao?: string };
  executar: (ids: string[]) => Promise<ResultadoEmMassa>;
  /** Aviso de sucesso: "3 usuários inativados." */
  sucesso: (feitos: number) => string;
};

/** Chama a rota em massa do recurso. */
export const emMassa = (caminho: string, acao: string) => (ids: string[]) => api.post<ResultadoEmMassa>(caminho, { acao, ids });

/** "1 usuário" / "3 usuários". */
export const plural = (n: number, singular: string, pluralDaPalavra: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? singular : pluralDaPalavra}`;
