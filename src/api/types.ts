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

export type TipoConta = Enums<"tipo_conta">;

export type Conta = {
  id: string;
  descricao: string;
  tipo: TipoConta;
  categoria: { id: string; nome: string } | null;
  subcategoria: { id: string; nome: string } | null;
  empresaContabil: { id: string; nome: string } | null;
  valorBase: number;
  ajustes: import("@/lib/contas").Ajuste[];
  valor: number;
  /** AAAA-MM-DD */
  dataVencimento: string;
  dataPagamento: string | null;
  /** O banco guarda pendente/pago; "vencida" é calculada (lib/contas.ts). */
  status: "pendente" | "pago";
  bancoPagamento: string | null;
  observacao: string | null;
  recorrente: boolean;
  grupoRecorrencia: string | null;
  criadoEm: string;
};
export type ParcelaSerie = { id: string; dataVencimento: string; valor: number; status: "pendente" | "pago" };
export type ContaDetalhe = Conta & { serie: ParcelaSerie[] };
export type ListaContas = { contas: Conta[]; meta: MetaLista };
export type ResumoContas = { aPagar: number; aReceber: number; pagoNoPeriodo: number; vencidas: number; valorVencido: number; vencemEm7Dias: number; total: number };

export type Categoria = { id: string; nome: string; ativo: boolean; subcategorias: { id: string; nome: string; ativo: boolean }[] };

export type PontoMensal = { competencia: string; quantidade: number; valorNf: number; repasse: number };
export type PainelGeral = {
  mes: ResumoRegistros;
  pendenteTotal: ResumoRegistros;
  contas: ResumoContas;
  cadastros: { clientes: number; prestadores: number; empresasContabeis: number; provisorios: number };
  serie: PontoMensal[];
  /** Tributos retidos nas notas da competência atual (CSRF = PIS + COFINS + CSLL). */
  retencoesMes: { iss: number; ir: number; csrf: number };
  topClientes: LinhaRanking[];
  proximasContas: Conta[];
};

/** Totais de um intervalo de competências no relatório (notas canceladas ficam de fora). */
export type ResumoRelatorio = {
  quantidade: number;
  valorNf: number;
  tributos: number;
  repasse: number;
  repassePago: number;
  repassePendente: number;
  pagos: number;
  pendentes: number;
  prestadores: number;
  clientes: number;
  /** Dias, em média, entre o fim do mês da competência e o pagamento do repasse. */
  prazoMedioDias: number | null;
};
export type PontoRelatorio = {
  competencia: string;
  quantidade: number;
  valorNf: number;
  tributos: number;
  iss: number;
  ir: number;
  /** PIS + COFINS + CSLL (contribuições retidas na fonte, recolhidas juntas). */
  csrf: number;
  repasse: number;
  repassePago: number;
  repassePendente: number;
};
/** Totais por tomador (cliente/hospital) no relatório, com as retenções. */
export type LinhaTomador = LinhaRanking & { documento: string; iss: number; ir: number; csrf: number; tributos: number };
/** Faixa de idade dos repasses pendentes: 0 = do mês atual, 1 = 1 mês, 2 = 2 meses, 3 = 3 a 5 meses, 4 = 6 meses ou mais. */
export type FaixaEnvelhecimento = { faixa: 0 | 1 | 2 | 3 | 4; quantidade: number; valor: number };

/** Relatório do período (função relatorio_periodo): tudo o que a tela Relatórios mostra, numa chamada. */
export type Relatorio = {
  periodo: { de: string; ate: string; meses: number; anteriorDe: string; anteriorAte: string };
  atual: ResumoRelatorio;
  /** Mesmo número de meses, imediatamente antes do período. */
  anterior: ResumoRelatorio;
  canceladas: { quantidade: number; valorNf: number };
  serie: PontoRelatorio[];
  tributos: { iss: number; ir: number; pis: number; cofins: number; csll: number };
  descontos: { padrao: number; adicional: number; acrescimo: number };
  envelhecimento: FaixaEnvelhecimento[];
  empresas: { id: string; nome: string; quantidade: number; valorNf: number; repasse: number }[];
  prestadores: LinhaRanking[];
  clientes: LinhaTomador[];
  contas: {
    serie: { competencia: string; pagar: number; receber: number }[];
    resumo: { quantidade: number; pagar: number; receber: number; pagas: number; recebidas: number; vencidas: number; valorVencido: number };
    /** Contas a pagar por categoria (as 12 maiores). */
    categorias: { nome: string; valor: number; quantidade: number }[];
  };
};

/** Pedido de acesso feito na tela de login, aguardando um administrador. */
export type PedidoAcesso = { id: string; nome: string; email: string; telefone: string | null; mensagem: string | null; criadoEm: string };

export type Usuario = { id: string; nome: string; email: string; papel: "admin" | "usuario"; ativo: boolean; trocarSenha: boolean; criadoEm: string; empresa?: { id: string; nome: string } };
export type ListaUsuarios = { usuarios: Usuario[]; meta: MetaLista };
export type Empresa = { id: string; nome: string; cnpj: string | null; status: StatusAtivo; isSteto: boolean; criadoEm: string };
export type ListaEmpresas = { empresas: Empresa[]; meta: MetaLista };

export type EventoAuditoria = {
  id: number;
  quando: string;
  usuarioEmail: string | null;
  tabela: string;
  registroId: string | null;
  acao: "criou" | "alterou" | "excluiu";
  /** Nome legível do registro (razão social, nome, descrição…). */
  alvo: string;
  alteracoes: { campo: string; antes: unknown; depois: unknown }[];
};
export type ListaAuditoria = { eventos: EventoAuditoria[]; meta: MetaLista };

export type Importacao = {
  id: string;
  tipo: import("@/lib/importacao/campos").TipoImportacao;
  nomeArquivo: string;
  totalLinhas: number;
  importadas: number;
  falhadas: number;
  novosCadastros: number;
  status: "sucesso" | "parcial" | "falha";
  erros: { linha: number; erro: string }[];
  criadoEm: string;
};
export type ListaImportacoes = { importacoes: Importacao[]; meta: MetaLista };
