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
