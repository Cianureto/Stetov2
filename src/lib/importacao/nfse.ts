// Leitura de NFSe em XML (Ginfes/ABRASF e variantes), portada do app antigo sem mudar as heurísticas:
// ignora namespaces, aceita tags alternativas, tira o nome do médico e os dados bancários da discriminação.
import { formatarDocumento } from "@/lib/format";
import { somenteDigitos } from "@/lib/mascaras";

const nomeTag = (el: Element) => (el.localName || el.tagName || "").toLowerCase();

function textoTag(doc: Document, ...tags: string[]): string | null {
  const quero = tags.map((t) => t.toLowerCase());
  for (const el of Array.from(doc.getElementsByTagName("*"))) {
    if (!quero.includes(nomeTag(el))) continue;
    const t = el.textContent?.trim();
    if (t) return t;
  }
  return null;
}

/** Primeira tag (entre `tags`) que tenha algum ancestral em `pais`. */
function textoDentro(doc: Document, pais: string[], tags: string[], transformar = (t: string) => t): string | null {
  const ps = pais.map((p) => p.toLowerCase());
  const quero = tags.map((t) => t.toLowerCase());
  for (const el of Array.from(doc.getElementsByTagName("*"))) {
    if (!quero.includes(nomeTag(el))) continue;
    const t = transformar(el.textContent?.trim() ?? "");
    if (!t) continue;
    for (let p = el.parentElement; p; p = p.parentElement) if (ps.includes(nomeTag(p))) return t;
  }
  return null;
}

function monetario(v: string | null): number {
  if (!v) return 0;
  const s = v.replace(/[^\d,.]/g, "");
  if (!s) return 0;
  return (s.includes(",") ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s)) || 0;
}

/** Competência → AAAA-MM-01. */
function competencia(v: string | null): string {
  const s = (v ?? "").trim();
  let m = /^(\d{4})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-01`;
  m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2]}-01`;
  m = /^(\d{2})\/(\d{4})$/.exec(s);
  if (m) return `${m[2]}-${m[1]}-01`;
  return "";
}

const limparNome = (v: string | null | undefined) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .replace(/\b(CPF|CNPJ|CRM|UF)\b[:\s-]*/gi, "")
    .replace(/\b\d{2,}[A-Z/-]*\b/g, "")
    .trim()
    .replace(/[-,:;]+$/, "")
    .trim();

const pareceEmpresa = (v: string) => {
  const t = limparNome(v).toUpperCase();
  return !!t && [" LTDA", " EIRELI", " S/A", " SA ", " SERVICOS", " CLINICA", " HOSPITAL", " CONSULTORIA", " EMPRESA", " SOCIEDADE", " ASSOCIADOS", " CENTRO MEDICO"].some((x) => t.includes(x));
};

const asciiMaiusculo = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

function nomeDoMedicoNoTexto(texto: string | null): string {
  if (!texto?.trim()) return "";
  const ascii = asciiMaiusculo(texto);
  const fim = "(?=\\s+(?:DADOS|BANCARIOS|CPF|CRM|BANCO|PIX|AGENCIA|CONTA)|\\s*$)";
  const nome = `([A-Z][A-Z\\s]{3,}?)${fim}`;
  const padroes = [
    new RegExp(`SERVICOS?\\s+MEDICOS?\\s+PRESTADOS?\\s+${nome}`),
    new RegExp(`PRESTADOS?\\s+POR\\s*:?\\s*${nome}`),
    new RegExp(`(?:MEDICO|MEDICA|PRESTADOR|PROFISSIONAL)\\s*[:\\-]\\s*${nome}`),
    new RegExp(`(?:DRA?|DOUTORA?)\\s*\\.?\\s*${nome}`),
  ];
  for (const p of padroes) {
    // Sem o título ("DR JOAO" → "JOAO").
    const c = (ascii.match(p)?.[1] ?? "").trim().replace(/\s+/g, " ").replace(/^(?:DRA?|DOUTORA?)\.?\s+/, "");
    if (c.length >= 4 && !pareceEmpresa(c)) return c;
  }
  const primeira = texto.split(/\r?\n|;/).map(limparNome).find(Boolean) ?? "";
  return primeira && !pareceEmpresa(primeira) ? primeira : "";
}

function bancoNoTexto(texto: string | null) {
  if (!texto) return {} as { banco?: string; agencia?: string; conta?: string; chavePix?: string };
  const a = asciiMaiusculo(texto);
  const r: { banco?: string; agencia?: string; conta?: string; chavePix?: string } = {};
  const b = a.match(/BANCO\s*[:-]?\s*([A-Z0-9][A-Z0-9\s]+?)(?:\s*-\s*(\d{3,4}))?(?=\s+(?:AGENCIA|AG|CONTA)|\s*$)/);
  if (b) r.banco = b[2] ? `${b[1].trim()} - ${b[2]}` : b[1].trim();
  const ag = a.match(/(?:AGENCIA|AG)[.:\s]+(\d{1,6}(?:[-/]\d{1,2})?)/);
  if (ag) r.agencia = ag[1];
  const ct = a.match(/(?:CONTA(?:\s+CORRENTE)?|CC)\s*[:\s]+(\d[\d.-]+\d)/);
  if (ct) r.conta = ct[1];
  const pix = a.match(/(?:CHAVE\s+PIX|PIX)\s*[:\s]+([^\s,;]+)/);
  if (pix) r.chavePix = pix[1];
  return r;
}

export type NotaXml = {
  nomeArquivo: string;
  numeroNfs: string;
  competencia: string;
  clienteNome: string;
  clienteDocumento: string;
  prestadorNome: string;
  prestadorCpf: string;
  empresaContabilNome: string;
  empresaContabilCnpj: string;
  valorNf: number;
  /** Percentuais tirados dos valores retidos na nota (sobre a base de cálculo). */
  aliquotas: { pis: number; cofins: number; csll: number; ir: number; iss: number };
  situacao: "pendente" | "pago" | "cancelado";
  banco: string;
  agencia: string;
  conta: string;
  chavePix: string;
};

const PRESTADOR = ["PrestadorServico", "Prestador", "DadosPrestador"];
const TOMADOR = ["TomadorServico", "Tomador", "DadosTomador"];
const docDentro = (doc: Document, pais: string[]) => somenteDigitos(textoDentro(doc, pais, ["Cnpj", "Cpf", "CpfCnpj"], somenteDigitos) ?? "");

export function lerNfse(xml: string, nomeArquivo = ""): NotaXml {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror")[0]) throw new Error(`XML inválido: ${nomeArquivo}`);

  const discriminacao = textoTag(doc, "Discriminacao", "DiscriminacaoServico", "Descricao", "DescricaoServico", "DescricaoServicos");
  const razaoPrestador = textoDentro(doc, PRESTADOR, ["RazaoSocial"]) ?? textoTag(doc, "RazaoSocialPrestador");
  const docPrestador = docDentro(doc, PRESTADOR) || somenteDigitos(textoTag(doc, "CnpjPrestador", "CpfPrestador", "DocumentoPrestador", "CnpjCpfPrestador", "CpfCnpjPrestador") ?? "");
  const TAGS_NOME = ["NomePrestador", "NomeFantasiaPrestador", "NomeProfissional", "NomeMedico", "Medico", "MedicoResponsavel", "Profissional", "ProfissionalSaude", "ResponsavelTecnico", "NomeResponsavel"];
  const nomeExplicito = textoDentro(doc, PRESTADOR, TAGS_NOME) ?? textoTag(doc, ...TAGS_NOME);
  const cpfExplicito = somenteDigitos(textoDentro(doc, PRESTADOR, ["CpfPrestador", "CpfProfissional", "CpfMedico", "DocumentoProfissional", "CpfResponsavel"]) ?? textoTag(doc, "CpfProfissional", "CpfMedico", "DocumentoProfissional", "CpfResponsavel") ?? "");

  const explicito = limparNome(nomeExplicito);
  const prestadorNome = explicito && !pareceEmpresa(explicito)
    ? explicito
    : nomeDoMedicoNoTexto(discriminacao) || (docPrestador.length === 11 ? limparNome(razaoPrestador) : "");
  const prestadorCpf = cpfExplicito.length === 11 ? cpfExplicito : docPrestador.length === 11 ? docPrestador : "";

  const valorServicos = textoTag(doc, "ValorServicos", "ValorBrutoNfse", "ValorTotalBruto", "ValorServicosPrestados");
  const valorLiquidoTxt = textoTag(doc, "ValorLiquidoNfse", "ValorNfse", "ValorTotalNfse", "ValorNota", "ValorTotal");
  const baseTxt = textoTag(doc, "BaseCalculo", "BaseDeCalculo");
  const bruto = monetario(valorServicos ?? valorLiquidoTxt);
  const liquido = monetario(valorLiquidoTxt);
  const baseLida = monetario(baseTxt);
  const valorNf = baseLida > 0 ? baseLida : liquido > 0 ? liquido : bruto;
  const base = baseLida || bruto || valorNf;
  const pct = (v: number) => (v && base ? Number(((v / base) * 100).toFixed(4)) : 0);

  // ABRASF: IssRetido é indicador (1 = retido, 2 = não retido). O app antigo lia o "2" como valor em reais e
  // zerava o ISS de toda nota não retida; aqui o indicador e o valor retido são lidos separadamente.
  const issRetido =
    ["1", "true", "sim", "s"].includes((textoTag(doc, "IssRetido", "ISSRetido") ?? "").toLowerCase().trim()) ||
    monetario(textoTag(doc, "ValorISSRetido", "ValorIssRetido")) > 0;
  const aliquotaIssTxt = textoTag(doc, "Aliquota", "AliquotaIss", "AliquotaISS");
  const aliquotas = {
    pis: pct(monetario(textoTag(doc, "ValorPis", "ValorPIS", "Pis", "PIS", "ValorDedPis", "ValorPisRetido"))),
    cofins: pct(monetario(textoTag(doc, "ValorCofins", "ValorCOFINS", "Cofins", "COFINS", "ValorDedCofins", "ValorCofinsRetido"))),
    csll: pct(monetario(textoTag(doc, "ValorCsll", "ValorCSLL", "Csll", "CSLL", "ValorDedCsll", "ValorCsllRetido"))),
    ir: pct(monetario(textoTag(doc, "ValorIr", "ValorIR", "Ir", "IR", "ValorDedIr", "ValorIrpj", "ValorIRRF", "ValorIrrf", "ValorIrRetido", "ValorRetIRRF"))),
    iss: issRetido ? 0 : aliquotaIssTxt ? monetario(aliquotaIssTxt) : pct(monetario(textoTag(doc, "ValorIss", "ValorISS", "ValorIssqn", "ValorIssQN", "Issqn", "ISSQN"))),
  };

  const situacaoTxt = (textoTag(doc, "SituacaoAdn", "Situacao", "SituacaoNfse", "Status") ?? "1").toUpperCase();
  const situacao = ["2", "C", "CANCELADO", "CANCELADA"].includes(situacaoTxt) ? "cancelado" : ["4", "P", "PAGO", "PAGA"].includes(situacaoTxt) ? "pago" : "pendente";

  const doTexto = bancoNoTexto(discriminacao);
  const contaBase = textoTag(doc, "NumeroConta", "Conta", "ContaCorrente", "ContaBancaria", "NumConta", "NumeroDaConta", "CC", "NumeroContaCorrente", "ContaNumero") ?? "";
  const dvConta = textoTag(doc, "DigitoConta", "DvConta", "DVConta", "ContaDv", "DigitoVerificadorConta", "DVContaCorrente", "DvContaCorrente") ?? "";
  const agenciaTag = textoTag(doc, "Agencia", "NumeroAgencia", "AgenciaPrestador", "AgenciaConta", "CodigoAgencia", "AgenciaNumero", "Ag", "NumAg", "NumeroAg") ?? "";
  const dvAgencia = textoTag(doc, "DigitoAgencia", "DvAgencia", "DVAgencia", "AgenciaDv", "DigitoVerificadorAgencia", "DVAg") ?? "";

  return {
    nomeArquivo,
    numeroNfs: textoTag(doc, "Numero", "NumeroNfse", "NfsNumero", "NumeroRps", "NumeroNFSe", "NumeroNFS") ?? "",
    competencia: competencia(textoTag(doc, "Competencia", "DataEmissao", "DataCompetencia")),
    clienteNome: textoDentro(doc, TOMADOR, ["RazaoSocial"]) ?? textoTag(doc, "RazaoSocialTomador", "NomeFantasiaTomador", "NomeTomador") ?? "",
    clienteDocumento: docDentro(doc, TOMADOR) || somenteDigitos(textoTag(doc, "CnpjTomador", "CpfTomador", "DocumentoTomador", "CnpjCpfTomador", "CpfCnpjTomador") ?? ""),
    prestadorNome,
    prestadorCpf,
    empresaContabilNome: limparNome(razaoPrestador),
    empresaContabilCnpj: docPrestador.length === 14 ? docPrestador : "",
    valorNf,
    aliquotas,
    situacao,
    banco: textoTag(doc, "NomeBanco", "Banco", "CodigoBanco", "NumeroBanco", "BancoNome", "DescricaoBanco", "InstituicaoFinanceira", "NomeInstituicao", "BancoCodigo", "CodigoInstituicao", "NumeroInstituicaoFinanceira", "CodigoIF") || doTexto.banco || "",
    agencia: (dvAgencia ? `${agenciaTag}-${dvAgencia}` : agenciaTag) || doTexto.agencia || "",
    conta: (contaBase ? (dvConta ? `${contaBase}-${dvConta}` : contaBase) : "") || doTexto.conta || "",
    chavePix: textoTag(doc, "ChavePix", "Pix", "ChavePIX", "PIX", "ChavePixPrestador", "ChaveDeContribuinte", "ChavePIXPrestador") || doTexto.chavePix || "",
  };
}

export const resumoNota = (n: NotaXml) => `${n.numeroNfs || "sem número"} · ${formatarDocumento(n.clienteDocumento) || n.clienteNome}`;
