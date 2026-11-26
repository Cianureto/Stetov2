// Processamento de uma importação (planilha ou XML): valida, resolve cadastros, calcula e grava em lotes.
import { todasAsLinhas } from "@/api/paginar";
import { supabase } from "@/api/supabase";
import { cnpjValido, cpfValido } from "@/lib/mascaras";
import type { TipoImportacao } from "@/lib/importacao/campos";
import { competencia, data, documento, nomeChave, numero, regime, situacaoRegistro, texto } from "@/lib/importacao/normalizar";
import { aliquotasDoCliente, calcularRepasse, type Aliquotas } from "@/lib/repasse";

export type Linha = Record<string, unknown>;
export type Resultado = { importadas: number; falhadas: number; novosCadastros: number; erros: { linha: number; erro: string }[] };

const LOTE = 200;
const nulo = (v: unknown) => texto(v) || null;

async function inserirEmLotes(tabela: "clientes" | "prestadores" | "empresas_contabeis" | "registros_financeiros", linhas: { n: number; dados: Record<string, unknown> }[], r: Resultado) {
  for (let i = 0; i < linhas.length; i += LOTE) {
    const lote = linhas.slice(i, i + LOTE);
    const { error } = await supabase.from(tabela).insert(lote.map((l) => l.dados) as never);
    if (!error) {
      r.importadas += lote.length;
      continue;
    }
    // Um lote recusado: tenta linha a linha para apontar qual falhou.
    for (const l of lote) {
      const { error: e } = await supabase.from(tabela).insert(l.dados as never);
      if (e) {
        r.falhadas++;
        r.erros.push({ linha: l.n, erro: e.code === "23505" ? "Já cadastrado." : "Não foi possível gravar a linha." });
      } else r.importadas++;
    }
  }
}

async function cadastros(tipo: Exclude<TipoImportacao, "registros_financeiros">, linhas: Linha[], importacaoId: string, r: Resultado) {
  const colunaDoc = tipo === "clientes" ? "documento" : tipo === "prestadores" ? "cpf" : "cnpj";
  const existentes = new Set((await todasAsLinhas(() => supabase.from(tipo).select(colunaDoc).order("id"))).map((x) => (x as unknown as Record<string, string>)[colunaDoc]));
  const validas: { n: number; dados: Record<string, unknown> }[] = [];
  linhas.forEach((l, i) => {
    const n = i + 2; // linha 1 é o cabeçalho
    const falhar = (erro: string) => (r.falhadas++, r.erros.push({ linha: n, erro }));
    if (tipo === "clientes") {
      const doc = documento(l.documento);
      if (!texto(l.razaoSocial)) return falhar("Sem razão social.");
      if (!(cnpjValido(doc) || cpfValido(doc))) return falhar("CNPJ/CPF inválido.");
      if (existentes.has(doc)) return falhar("Cliente já cadastrado com este documento.");
      existentes.add(doc);
      validas.push({ n, dados: {
        razao_social: texto(l.razaoSocial), documento: doc, tipo_pessoa: doc.length === 11 ? "PF" : "PJ", regime_tributario: regime(l.regimeTributario),
        email: nulo(l.email), telefone: documento(l.telefone) || null, endereco: nulo(l.endereco),
        aliquota_pis: numero(l.aliquotaPis), aliquota_cofins: numero(l.aliquotaCofins), aliquota_csll: numero(l.aliquotaCsll), aliquota_ir: numero(l.aliquotaIr), aliquota_iss: numero(l.aliquotaIss),
        desconto_padrao_percent: numero(l.descontoPadraoPercent), status: regime(l.regimeTributario) ? "ativo" : "provisorio", origem_importacao: "planilha", importacao_id: importacaoId,
      } });
    } else if (tipo === "prestadores") {
      const cpf = documento(l.cpf);
      if (!texto(l.nomeCompleto)) return falhar("Sem nome.");
      if (!cpfValido(cpf)) return falhar("CPF inválido.");
      if (existentes.has(cpf)) return falhar("Prestador já cadastrado com este CPF.");
      existentes.add(cpf);
      validas.push({ n, dados: {
        nome_completo: texto(l.nomeCompleto), cpf, crm: nulo(l.crm), email: nulo(l.email), telefone: documento(l.telefone) || null,
        banco: nulo(l.banco), agencia: nulo(l.agencia), conta: nulo(l.conta), chave_pix: nulo(l.chavePix), desconto_padrao_percent: numero(l.descontoPadraoPercent), importacao_id: importacaoId,
      } });
    } else {
      const cnpj = documento(l.cnpj);
      if (!texto(l.razaoSocial)) return falhar("Sem razão social.");
      if (!cnpjValido(cnpj)) return falhar("CNPJ inválido.");
      if (existentes.has(cnpj)) return falhar("Empresa já cadastrada com este CNPJ.");
      existentes.add(cnpj);
      validas.push({ n, dados: { razao_social: texto(l.razaoSocial), cnpj, nome_fantasia: nulo(l.nomeFantasia), importacao_id: importacaoId } });
    }
  });
  await inserirEmLotes(tipo, validas, r);
}

type ClienteIdx = { id: string; razao_social: string; documento: string; tipo_pessoa: "PJ" | "PF"; aliquota_pis: number; aliquota_cofins: number; aliquota_csll: number; aliquota_ir: number; aliquota_iss: number };
type PrestadorIdx = { id: string; nome_completo: string; cpf: string; desconto_padrao_percent: number; banco: string | null; agencia: string | null; conta: string | null; tipo_conta: "corrente" | "poupanca" | null; chave_pix: string | null };
type EmpresaIdx = { id: string; razao_social: string; nome_fantasia: string | null; cnpj: string };

/** Índice por documento e por nome (sem acento/caixa). */
function indice<T extends { id: string }>(itens: T[], doc: (t: T) => string, nomes: (t: T) => (string | null)[]) {
  const porDoc = new Map<string, T>();
  const porNome = new Map<string, T>();
  for (const t of itens) {
    if (doc(t)) porDoc.set(doc(t), t);
    for (const n of nomes(t)) if (n && !porNome.has(nomeChave(n))) porNome.set(nomeChave(n), t);
  }
  return { achar: (d: string, nome: string) => (d && porDoc.get(d)) || (nome && porNome.get(nomeChave(nome))) || null, porDoc, porNome };
}

async function registros(linhas: Linha[], importacaoId: string, criarFaltantes: boolean, r: Resultado) {
  const [cl, pr, em] = await Promise.all([
    todasAsLinhas(() => supabase.from("clientes").select("id, razao_social, documento, tipo_pessoa, aliquota_pis, aliquota_cofins, aliquota_csll, aliquota_ir, aliquota_iss").order("id")),
    todasAsLinhas(() => supabase.from("prestadores").select("id, nome_completo, cpf, desconto_padrao_percent, banco, agencia, conta, tipo_conta, chave_pix").order("id")),
    todasAsLinhas(() => supabase.from("empresas_contabeis").select("id, razao_social, nome_fantasia, cnpj").order("id")),
  ]);
  const clientes = indice(cl as ClienteIdx[], (c) => c.documento, (c) => [c.razao_social]);
  const prestadores = indice(pr as PrestadorIdx[], (p) => p.cpf, (p) => [p.nome_completo]);
  const empresas = indice(em as EmpresaIdx[], (e) => e.cnpj, (e) => [e.razao_social, e.nome_fantasia]);

  // Notas já lançadas (mesmo número para o mesmo cliente) não entram de novo.
  const numeros = [...new Set(linhas.map((l) => texto(l.numeroNfs)).filter(Boolean))];
  const jaLancadas = new Set<string>();
  for (let i = 0; i < numeros.length; i += LOTE) {
    const { data: rs, error } = await supabase.from("registros_financeiros").select("numero_nfs, cliente_id").in("numero_nfs", numeros.slice(i, i + LOTE));
    if (error) throw error;
    for (const x of rs) jaLancadas.add(`${x.cliente_id}|${x.numero_nfs}`);
  }

  async function criar<T>(tabela: "clientes" | "prestadores" | "empresas_contabeis", dados: Record<string, unknown>, select: string): Promise<T> {
    const { data: novo, error } = await supabase.from(tabela).insert({ ...dados, importacao_id: importacaoId } as never).select(select).single();
    if (error) throw error;
    r.novosCadastros++;
    return novo as T;
  }

  const validas: { n: number; dados: Record<string, unknown> }[] = [];
  for (const [i, l] of linhas.entries()) {
    const n = typeof l.__linha === "number" ? l.__linha : i + 2;
    try {
      const comp = competencia(l.competencia);
      const valorNf = numero(l.valorNf);
      if (!comp) throw new Error("Competência ausente ou inválida.");
      if (valorNf <= 0) throw new Error("Valor da NF ausente.");

      const docC = documento(l.clienteDocumento), nomeC = texto(l.clienteNome);
      let cliente = clientes.achar(docC, nomeC) as ClienteIdx | null;
      if (!cliente && criarFaltantes && nomeC) {
        cliente = await criar<ClienteIdx>("clientes", { razao_social: nomeC, documento: docC || "00000000000000", tipo_pessoa: docC.length === 11 ? "PF" : "PJ", status: "provisorio", origem_importacao: "importacao" }, "id, razao_social, documento, tipo_pessoa, aliquota_pis, aliquota_cofins, aliquota_csll, aliquota_ir, aliquota_iss");
        if (docC) clientes.porDoc.set(docC, cliente);
        clientes.porNome.set(nomeChave(nomeC), cliente);
      }
      const cpf = documento(l.prestadorCpf), nomeP = texto(l.prestadorNome);
      let prestador = prestadores.achar(cpf, nomeP) as PrestadorIdx | null;
      if (!prestador && criarFaltantes && nomeP) {
        prestador = await criar<PrestadorIdx>("prestadores", { nome_completo: nomeP, cpf: cpf || "00000000000", banco: nulo(l.banco), agencia: nulo(l.agencia), conta: nulo(l.conta), chave_pix: nulo(l.chavePix) }, "id, nome_completo, cpf, desconto_padrao_percent, banco, agencia, conta, tipo_conta, chave_pix");
        if (cpf) prestadores.porDoc.set(cpf, prestador);
        prestadores.porNome.set(nomeChave(nomeP), prestador);
      }
      const cnpjE = documento(l.empresaContabilCnpj), nomeE = texto(l.empresaContabilNome);
      let empresa = empresas.achar(cnpjE, nomeE) as EmpresaIdx | null;
      if (!empresa && criarFaltantes && nomeE && cnpjValido(cnpjE)) {
        empresa = await criar<EmpresaIdx>("empresas_contabeis", { razao_social: nomeE, cnpj: cnpjE }, "id, razao_social, nome_fantasia, cnpj");
        empresas.porDoc.set(cnpjE, empresa);
        empresas.porNome.set(nomeChave(nomeE), empresa);
      }
      const faltam = [!cliente && "cliente", !prestador && "prestador", !empresa && "empresa contábil"].filter(Boolean);
      if (faltam.length) throw new Error(`Não encontrado: ${faltam.join(", ")}.${criarFaltantes ? "" : " Marque “criar cadastros que faltam” ou cadastre antes."}`);

      const numeroNfs = texto(l.numeroNfs);
      if (numeroNfs && jaLancadas.has(`${cliente!.id}|${numeroNfs}`)) throw new Error(`NFS ${numeroNfs} já lançada para este cliente.`);
      if (numeroNfs) jaLancadas.add(`${cliente!.id}|${numeroNfs}`);

      const aliquotas: Aliquotas = (l.aliquotas as Aliquotas | undefined) ?? aliquotasDoCliente({
        tipoPessoa: cliente!.tipo_pessoa, aliquotaPis: Number(cliente!.aliquota_pis), aliquotaCofins: Number(cliente!.aliquota_cofins),
        aliquotaCsll: Number(cliente!.aliquota_csll), aliquotaIr: Number(cliente!.aliquota_ir), aliquotaIss: Number(cliente!.aliquota_iss),
      });
      const descontoPercent = Number(prestador!.desconto_padrao_percent);
      const descontoAdicional = numero(l.descontoAdicional), acrescimo = numero(l.acrescimo);
      const c = calcularRepasse({ valorNf, aliquotas, descontoPadraoPercent: descontoPercent, descontoAdicional, acrescimo });
      if (c.valorFinalRepasse < 0) throw new Error("Repasse negativo: desconto adicional maior que a nota.");
      const situacao = situacaoRegistro(l.situacao);
      validas.push({ n, dados: {
        cliente_id: cliente!.id, prestador_id: prestador!.id, empresa_contabil_id: empresa!.id, competencia: comp, numero_nfs: numeroNfs || null, setor: nulo(l.setor),
        situacao, data_pagamento: data(l.dataPagamento), tipo_pagamento: "banco", valor_nf: valorNf,
        aliquota_pis: aliquotas.pis, aliquota_cofins: aliquotas.cofins, aliquota_csll: aliquotas.csll, aliquota_ir: aliquotas.ir, aliquota_iss: aliquotas.iss,
        valor_pis: c.tributos.pis, valor_cofins: c.tributos.cofins, valor_csll: c.tributos.csll, valor_ir: c.tributos.ir, valor_iss: c.tributos.iss, valor_total_tributos: c.valorTotalTributos,
        desconto_padrao_percent: descontoPercent, desconto_padrao_aplicado: c.descontoPadraoAplicado, desconto_adicional: descontoAdicional, acrescimo, valor_final_repasse: c.valorFinalRepasse,
        banco: prestador!.banco ?? nulo(l.banco), agencia: prestador!.agencia ?? nulo(l.agencia), conta: prestador!.conta ?? nulo(l.conta), tipo_conta: prestador!.tipo_conta, chave_pix: prestador!.chave_pix ?? nulo(l.chavePix),
        importacao_id: importacaoId,
      } });
    } catch (e) {
      r.falhadas++;
      r.erros.push({ linha: n, erro: e instanceof Error ? e.message : "Linha inválida." });
    }
  }
  await inserirEmLotes("registros_financeiros", validas, r);
}

export async function processarImportacao(tipo: TipoImportacao, linhas: Linha[], importacaoId: string, criarFaltantes: boolean): Promise<Resultado> {
  const r: Resultado = { importadas: 0, falhadas: 0, novosCadastros: 0, erros: [] };
  if (tipo === "registros_financeiros") await registros(linhas, importacaoId, criarFaltantes, r);
  else await cadastros(tipo, linhas, importacaoId, r);
  return r;
}
