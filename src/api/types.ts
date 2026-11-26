// Tipos das respostas das rotas (src/api/rotas). Campos em camelCase, como no ConectaPRO; o banco é snake_case.
import type { Enums } from "@/lib/database.types";
import type { MetaLista } from "@/lib/tabela";

export type RegimeTributario = Enums<"regime_tributario">;
export type StatusCliente = Enums<"status_cliente">;

export type Cliente = {
  id: string;
  razaoSocial: string;
  tipoPessoa: "PJ" | "PF";
  documento: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  regimeTributario: RegimeTributario | null;
  aliquotaPis: number;
  aliquotaCofins: number;
  aliquotaCsll: number;
  aliquotaIr: number;
  aliquotaIss: number;
  descontoPadraoPercent: number;
  status: StatusCliente;
  origemImportacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type ListaClientes = { clientes: Cliente[]; meta: MetaLista };
export type ResumoClientes = { total: number; ativo: number; inativo: number; provisorio: number; semRegime: number };
export type ResultadoEmMassa = { feitos: number; falhas: { id: string; erro: string }[] };
