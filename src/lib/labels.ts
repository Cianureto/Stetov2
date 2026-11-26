import type { Enums } from "@/lib/database.types";

export const REGIME_LABEL: Record<Enums<"regime_tributario">, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
};

export const STATUS_CLIENTE_LABEL: Record<Enums<"status_cliente">, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  provisorio: "Provisório",
};

export const TIPO_PESSOA_LABEL: Record<Enums<"tipo_pessoa">, string> = { PJ: "Pessoa jurídica", PF: "Pessoa física" };

export const STATUS_ATIVO_LABEL: Record<Enums<"status_ativo">, string> = { ativo: "Ativo", inativo: "Inativo" };
export const TIPO_CONTA_BANCARIA_LABEL: Record<Enums<"tipo_conta_bancaria">, string> = { corrente: "Corrente", poupanca: "Poupança" };
export const CADASTRO_LABEL = { true: "Completo", false: "Incompleto" } as const;

export const SITUACAO_REGISTRO_LABEL: Record<Enums<"situacao_registro">, string> = { pendente: "Pendente", pago: "Pago", cancelado: "Cancelado" };
export const TIPO_PAGAMENTO_LABEL: Record<Enums<"tipo_pagamento">, string> = { banco: "Banco", caixa: "Caixa" };
