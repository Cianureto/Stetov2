import type { Importacao } from "@/api/types";
import { baixarCsv } from "@/lib/csv";

/** Planilha com os erros por linha de uma importação. */
export const baixarErros = (i: Importacao) => baixarCsv(`erros-${i.nomeArquivo.replace(/\.[^.]+$/, "")}`, i.erros.map((e) => ({ Linha: e.linha, Erro: e.erro })));
