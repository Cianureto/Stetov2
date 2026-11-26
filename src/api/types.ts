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

export type StatusAtivo = Enums<"status_ativo">;
export type TipoContaBancaria = Enums<"tipo_conta_bancaria">;

export type Prestador = {
  id: string;
  nomeCompleto: string;
  cpf: string;
  crm: string | null;
  telefone: string | null;
  email: string | null;
  regimeTributario: RegimeTributario | null;
  descontoPadraoPercent: number;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipoConta: TipoContaBancaria | null;
  chavePix: string | null;
  status: StatusAtivo;
  /** Nome, CPF, telefone, e-mail, banco e agência preenchidos (calculado no banco). */
  cadastroCompleto: boolean;
  clientes: { id: string; razaoSocial: string }[];
  empresasContabeis: { id: string; nome: string }[];
  criadoEm: string;
};

export type ListaPrestadores = { prestadores: Prestador[]; meta: MetaLista };
export type ResumoPrestadores = { total: number; completos: number; incompletos: number; inativos: number };

/** Opção de seletor vinda de uma rota `/…/opcoes`. */
export type OpcaoApi = { valor: string; rotulo: string; descricao?: string };

export type EmpresaContabil = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  status: StatusAtivo;
  criadoEm: string;
};
export type ListaEmpresasContabeis = { empresasContabeis: EmpresaContabil[]; meta: MetaLista };
export type ResumoEmpresasContabeis = { total: number; ativas: number; inativas: number };

/** Totais de registros (função resumo_registros no banco). */
export type ResumoRegistros = {
  quantidade: number;
  valorNf: number;
  tributos: number;
  repasse: number;
  repassePago: number;
  repassePendente: number;
  pendentes: number;
  pagos: number;
  cancelados: number;
};

/** Linha de ranking (função ranking_registros): por cliente ou por prestador. */
export type LinhaRanking = { id: string; nome: string; quantidade: number; valorNf: number; repasse: number; repassePago: number; repassePendente: number };

export type PainelEmpresaContabil = { empresa: EmpresaContabil; resumo: ResumoRegistros; clientes: LinhaRanking[]; prestadores: LinhaRanking[] };

export type SituacaoRegistro = Enums<"situacao_registro">;
export type TipoPagamento = Enums<"tipo_pagamento">;

export type Registro = {
  id: string;
  cliente: { id: string; razaoSocial: string; tipoPessoa: "PJ" | "PF" };
  prestador: { id: string; nomeCompleto: string };
  empresaContabil: { id: string; nome: string };
  numeroNfs: string | null;
  /** AAAA-MM-01 */
  competencia: string;
  dataPagamento: string | null;
  situacao: SituacaoRegistro;
  tipoPagamento: TipoPagamento | null;
  setor: string | null;
  valorNf: number;
  aliquotas: { pis: number; cofins: number; csll: number; ir: number; iss: number };
  valorTotalTributos: number;
  descontoPadraoPercent: number;
  descontoPadraoAplicado: number;
  descontoAdicional: number;
  acrescimo: number;
  valorFinalRepasse: number;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipoConta: TipoContaBancaria | null;
  chavePix: string | null;
  criadoEm: string;
};
export type ListaRegistros = { registros: Registro[]; meta: MetaLista };
