// Campos de cada tipo de importação (o mapeamento liga as colunas da planilha a estes campos).
import { normalizarBusca } from "@/lib/busca";

export type TipoImportacao = "registros_financeiros" | "clientes" | "prestadores" | "empresas_contabeis";

export type CampoImportacao = { chave: string; rotulo: string; obrigatorio?: boolean; apelidos?: string[] };

export const ROTULO_TIPO: Record<TipoImportacao, string> = {
  registros_financeiros: "Registros financeiros",
  clientes: "Clientes",
  prestadores: "Prestadores",
  empresas_contabeis: "Empresas contábeis",
};

export const CAMPOS: Record<TipoImportacao, CampoImportacao[]> = {
  registros_financeiros: [
    { chave: "clienteNome", rotulo: "Cliente (nome)", obrigatorio: true, apelidos: ["cliente", "tomador", "hospital", "razao social tomador"] },
    { chave: "clienteDocumento", rotulo: "Cliente (CNPJ/CPF)", apelidos: ["cnpj cliente", "cnpj tomador", "documento cliente"] },
    { chave: "prestadorNome", rotulo: "Prestador (nome)", obrigatorio: true, apelidos: ["prestador", "medico", "profissional"] },
    { chave: "prestadorCpf", rotulo: "Prestador (CPF)", apelidos: ["cpf", "cpf prestador", "cpf medico"] },
    { chave: "empresaContabilNome", rotulo: "Empresa contábil (nome)", obrigatorio: true, apelidos: ["empresa", "empresa contabil", "emitente"] },
    { chave: "empresaContabilCnpj", rotulo: "Empresa contábil (CNPJ)", apelidos: ["cnpj empresa", "cnpj emitente"] },
    { chave: "numeroNfs", rotulo: "Nº da NFS", apelidos: ["nfs", "nf", "numero", "numero nfs", "nota"] },
    { chave: "competencia", rotulo: "Competência (MM/AAAA)", obrigatorio: true, apelidos: ["mes ano", "mes/ano", "referencia", "competencia", "data referencia"] },
    { chave: "valorNf", rotulo: "Valor da NF (R$)", obrigatorio: true, apelidos: ["valor", "valor nf", "valor nota", "valor bruto"] },
    { chave: "situacao", rotulo: "Situação", apelidos: ["status"] },
    { chave: "dataPagamento", rotulo: "Data do pagamento", apelidos: ["pagamento", "data pagto", "pago em"] },
    { chave: "setor", rotulo: "Setor" },
    { chave: "descontoAdicional", rotulo: "Desconto adicional (R$)", apelidos: ["desconto"] },
    { chave: "acrescimo", rotulo: "Acréscimo / devolução (R$)", apelidos: ["devolucao", "acrescimo"] },
  ],
  clientes: [
    { chave: "razaoSocial", rotulo: "Razão social / nome", obrigatorio: true, apelidos: ["nome", "cliente", "razao social"] },
    { chave: "documento", rotulo: "CNPJ / CPF", obrigatorio: true, apelidos: ["cnpj", "cpf", "documento"] },
    { chave: "regimeTributario", rotulo: "Regime tributário", apelidos: ["regime"] },
    { chave: "email", rotulo: "E-mail", apelidos: ["email"] },
    { chave: "telefone", rotulo: "Telefone", apelidos: ["fone", "celular"] },
    { chave: "endereco", rotulo: "Endereço" },
    { chave: "aliquotaPis", rotulo: "PIS (%)", apelidos: ["pis"] },
    { chave: "aliquotaCofins", rotulo: "COFINS (%)", apelidos: ["cofins"] },
    { chave: "aliquotaCsll", rotulo: "CSLL (%)", apelidos: ["csll"] },
    { chave: "aliquotaIr", rotulo: "IR (%)", apelidos: ["ir", "irrf"] },
    { chave: "aliquotaIss", rotulo: "ISS (%)", apelidos: ["iss"] },
    { chave: "descontoPadraoPercent", rotulo: "Desconto padrão (%)", apelidos: ["desconto"] },
  ],
  prestadores: [
    { chave: "nomeCompleto", rotulo: "Nome completo", obrigatorio: true, apelidos: ["nome", "prestador", "medico"] },
    { chave: "cpf", rotulo: "CPF", obrigatorio: true },
    { chave: "crm", rotulo: "CRM" },
    { chave: "email", rotulo: "E-mail" },
    { chave: "telefone", rotulo: "Telefone", apelidos: ["fone", "celular"] },
    { chave: "banco", rotulo: "Banco" },
    { chave: "agencia", rotulo: "Agência", apelidos: ["ag"] },
    { chave: "conta", rotulo: "Conta", apelidos: ["conta corrente", "cc"] },
    { chave: "chavePix", rotulo: "Chave Pix", apelidos: ["pix"] },
    { chave: "descontoPadraoPercent", rotulo: "Desconto padrão (%)", apelidos: ["desconto"] },
  ],
  empresas_contabeis: [
    { chave: "razaoSocial", rotulo: "Razão social", obrigatorio: true, apelidos: ["nome", "empresa", "razao social"] },
    { chave: "cnpj", rotulo: "CNPJ", obrigatorio: true },
    { chave: "nomeFantasia", rotulo: "Nome fantasia", apelidos: ["fantasia"] },
  ],
};

/** Sugere a coluna da planilha para cada campo: nome igual, depois apelido, sem acento e sem diferenciar caixa. */
export function mapearAutomatico(colunas: string[], campos: CampoImportacao[]): Record<string, string> {
  const norm = (s: string) => normalizarBusca(s).replace(/[^a-z0-9]+/g, " ").trim();
  const porNome = new Map(colunas.map((c) => [norm(c), c]));
  const usadas = new Set<string>();
  const mapa: Record<string, string> = {};
  for (const campo of campos) {
    const candidatos = [campo.chave.replace(/([A-Z])/g, " $1"), campo.rotulo.replace(/\(.*\)/, ""), ...(campo.apelidos ?? [])].map(norm);
    const achada = candidatos.map((c) => porNome.get(c)).find((c) => c && !usadas.has(c));
    if (achada) {
      mapa[campo.chave] = achada;
      usadas.add(achada);
    }
  }
  return mapa;
}
