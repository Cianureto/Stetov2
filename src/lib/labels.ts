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
