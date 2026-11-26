// Dados de demonstração do Steto. Entra com um usuário real (as regras de acesso valem) e grava tudo
// marcado com legacy_id "demo-…", para `limpar.mjs` apagar depois sem tocar em dados de verdade.
//
//   STETO_EMAIL=... STETO_SENHA=... node scripts/demo/semear.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => l.split("=")));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_PUBLISHABLE_KEY.trim(), { auth: { persistSession: false } });

// ── utilitários ──
let semente = 42;
const aleatorio = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];
const entre = (a, b) => a + aleatorio() * (b - a);
const centavos = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
const dv = (base, pesos) => { const r = base.split("").reduce((s, n, i) => s + Number(n) * pesos[i], 0) % 11; return r < 2 ? 0 : 11 - r; };
const cnpj = (n) => { const b = String(10_000_000 + n * 7919).padStart(8, "0").slice(0, 8) + "0001"; const d1 = dv(b, [5,4,3,2,9,8,7,6,5,4,3,2]); const d2 = dv(b + d1, [6,5,4,3,2,9,8,7,6,5,4,3,2]); return `${b}${d1}${d2}`; };
const cpf = (n) => { const b = String(100_000_000 + n * 7_654_321).slice(0, 9); const d1 = dv(b, [10,9,8,7,6,5,4,3,2]); const d2 = dv(b + d1, [11,10,9,8,7,6,5,4,3,2]); return `${b}${d1}${d2}`; };
const hoje = new Date(Date.now() - 3 * 3600_000);
const iso = (d) => d.toISOString().slice(0, 10);
const somarMeses = (d, m, dia) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, 1)); const ult = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate(); x.setUTCDate(Math.min(dia ?? 1, ult)); return x; };
const somarDias = (d, n) => new Date(d.getTime() + n * 86_400_000);

async function inserir(tabela, linhas, select = "*") {
  const saida = [];
  for (let i = 0; i < linhas.length; i += 200) {
    const { data, error } = await supabase.from(tabela).insert(linhas.slice(i, i + 200), { defaultToNull: false }).select(select);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    saida.push(...data);
  }
  return saida;
}

// ── login ──
const { error: erroLogin } = await supabase.auth.signInWithPassword({ email: process.env.STETO_EMAIL, password: process.env.STETO_SENHA });
if (erroLogin) throw new Error(`Login: ${erroLogin.message}`);
const { count: jaTem } = await supabase.from("empresas_contabeis").select("*", { count: "exact", head: true }).like("legacy_id", "demo-%");
if (jaTem) throw new Error("Já há dados de demonstração. Rode limpar.mjs antes.");

// ── empresas contábeis ──
const empresas = await inserir("empresas_contabeis", [
  ["Steto Serviços Médicos Ltda", "Steto Médicos"],
  ["Vitta Gestão em Saúde Ltda", "Vitta Saúde"],
  ["Prime Medical Services S/A", null],
].map(([razao, fantasia], i) => ({ razao_social: razao, nome_fantasia: fantasia, cnpj: cnpj(i + 1), legacy_id: `demo-ec-${i}` })));

// ── clientes ──
const PRESUMIDO = { aliquota_pis: 0.65, aliquota_cofins: 3, aliquota_csll: 1, aliquota_ir: 1.5 };
const clientes = await inserir("clientes", [
  ["Hospital São Lucas Ltda", "lucro_presumido", 2, 5, "ativo"],
  ["Hospital Regional do Vale", "lucro_real", 5, 6, "ativo"],
  ["Clínica Vida Plena", "simples_nacional", 3, 4, "ativo"],
  ["Hospital Santa Clara S.A.", "lucro_real", 5, 6.5, "ativo"],
  ["Instituto Cardiológico Paulista", "lucro_presumido", 2, 5, "ativo"],
  ["Centro Médico Aurora", "simples_nacional", 2.5, 3, "ativo"],
  ["Hospital Municipal Boa Esperança", "lucro_presumido", 3, 5, "ativo"],
  ["Clínica Ortopédica Movimento", "lucro_presumido", 3, 5, "ativo"],
  ["Policlínica Bem Estar", "simples_nacional", 2, 3, "inativo"],
  ["Hospital Dia Santa Fé", null, 0, 0, "provisorio"],
  ["Clinica Sorriso Pleno", null, 0, 0, "provisorio"],
].map(([nome, regime, iss, desconto, status], i) => ({
  razao_social: nome, documento: cnpj(100 + i), tipo_pessoa: "PJ", regime_tributario: regime, status,
  ...(regime === "simples_nacional" || !regime ? {} : PRESUMIDO), aliquota_iss: iss, desconto_padrao_percent: desconto,
  email: `financeiro${i}@exemplo.com.br`, telefone: `1132${String(100000 + i * 37).slice(-6)}`, origem_importacao: status === "provisorio" ? "importacao" : null,
  legacy_id: `demo-cl-${i}`,
})).concat([{ razao_social: "Maria Helena Prado", documento: cpf(900), tipo_pessoa: "PF", regime_tributario: "simples_nacional", status: "ativo", legacy_id: "demo-cl-pf" }]));
const clientesAtivos = clientes.filter((c) => c.status === "ativo");

// ── prestadores ──
const BANCOS = ["341 · Itaú", "237 · Bradesco", "001 · Banco do Brasil", "260 · Nubank", "104 · Caixa Econômica Federal", "077 · Banco Inter"];
const prestadores = await inserir("prestadores", [
  "Ana Beatriz Lima", "Bruno Carvalho Souza", "Carla Mendes Rocha", "Daniel Ferreira Alves", "Eduarda Nogueira Pinto",
  "Felipe Araújo Castro", "Gabriela Torres Ribeiro", "Henrique Barros Duarte", "Isabela Martins Freitas", "João Pedro Cardoso",
].map((nome, i) => {
  const completo = i < 7;
  return {
    nome_completo: nome, cpf: cpf(i + 1), crm: `${120000 + i * 731}/SP`, status: i === 9 ? "inativo" : "ativo",
    regime_tributario: escolher(["simples_nacional", "lucro_presumido"]), desconto_padrao_percent: escolher([3, 4, 5, 5, 6, 8]),
    telefone: completo ? `119${String(80000000 + i * 1234567).slice(0, 8)}` : null,
    email: completo || i === 8 ? `${nome.split(" ")[0].toLowerCase()}@exemplo.com.br` : null,
    banco: completo ? BANCOS[i % BANCOS.length] : null, agencia: completo ? String(1000 + i * 111) : null,
    conta: completo ? `${10000 + i * 4321}-${i}` : null, tipo_conta: "corrente", chave_pix: completo ? cpf(i + 1) : null,
    legacy_id: `demo-pr-${i}`,
  };
}));

// ── vínculos (1 a 3 clientes e 1 empresa contábil por prestador) ──
const vinculosClientes = [];
const atende = new Map();
prestadores.forEach((p, i) => {
  const qtd = 1 + (i % 3);
  const lista = [...new Set(Array.from({ length: qtd }, (_, k) => clientesAtivos[(i * 2 + k * 3) % clientesAtivos.length].id))];
  atende.set(p.id, lista);
  lista.forEach((c) => vinculosClientes.push({ prestador_id: p.id, cliente_id: c }));
});
await inserir("prestador_clientes", vinculosClientes, "prestador_id");
await inserir("prestador_empresas_contabeis", prestadores.map((p, i) => ({ prestador_id: p.id, empresa_contabil_id: empresas[i % empresas.length].id })), "prestador_id");

// ── registros financeiros: 12 meses, ~15 notas por mês ──
const registros = [];
let nfs = 4100;
for (let m = -11; m <= 0; m++) {
  const comp = somarMeses(hoje, m);
  for (let k = 0; k < 13 + Math.floor(aleatorio() * 6); k++) {
    const pi = Math.floor(aleatorio() * 9);
    const p = prestadores[pi];
    const idCli = escolher(atende.get(p.id));
    const cli = clientes.find((c) => c.id === idCli);
    if (!cli) throw new Error(`Cliente do vínculo não encontrado (prestador ${pi}).`);
    const empresa = empresas[pi % empresas.length];
    const valorNf = centavos(entre(2500, 28000));
    const al = cli.tipo_pessoa === "PF" ? { pis: 0, cofins: 0, csll: 0, ir: 0, iss: 0 } : { pis: +cli.aliquota_pis, cofins: +cli.aliquota_cofins, csll: +cli.aliquota_csll, ir: +cli.aliquota_ir, iss: +cli.aliquota_iss };
    const trib = Object.fromEntries(Object.entries(al).map(([t, v]) => [t, centavos((valorNf * v) / 100)]));
    const totalTrib = centavos(Object.values(trib).reduce((s, v) => s + v, 0));
    const desc = +p.desconto_padrao_percent;
    const descAplicado = centavos((valorNf * desc) / 100);
    const descAdicional = aleatorio() < 0.1 ? centavos(entre(50, 300)) : 0;
    const acrescimo = aleatorio() < 0.05 ? centavos(entre(80, 400)) : 0;
    const antigo = m <= -2;
    const situacao = aleatorio() < 0.03 ? "cancelado" : antigo || (m === -1 && aleatorio() < 0.6) ? "pago" : "pendente";
    registros.push({
      cliente_id: cli.id, prestador_id: p.id, empresa_contabil_id: empresa.id, competencia: iso(comp), numero_nfs: String(nfs++),
      setor: escolher([null, "UTI", "Pronto-socorro", "Centro cirúrgico", "Ambulatório"]), situacao, tipo_pagamento: "banco",
      data_pagamento: situacao === "pago" ? iso(somarDias(somarMeses(hoje, m + 1, 10), Math.floor(entre(0, 12)))) : null,
      valor_nf: valorNf, aliquota_pis: al.pis, aliquota_cofins: al.cofins, aliquota_csll: al.csll, aliquota_ir: al.ir, aliquota_iss: al.iss,
      valor_pis: trib.pis, valor_cofins: trib.cofins, valor_csll: trib.csll, valor_ir: trib.ir, valor_iss: trib.iss, valor_total_tributos: totalTrib,
      desconto_padrao_percent: desc, desconto_padrao_aplicado: descAplicado, desconto_adicional: descAdicional, acrescimo,
      valor_final_repasse: centavos(valorNf - descAplicado - descAdicional + acrescimo),
      banco: p.banco, agencia: p.agencia, conta: p.conta, tipo_conta: p.tipo_conta, chave_pix: p.chave_pix,
      legacy_id: `demo-rf-${nfs}`,
    });
  }
}
await inserir("registros_financeiros", registros, "id");

// ── categorias e contas ──
const cats = await inserir("categorias_contas", ["Aluguel", "Folha de pagamento", "Impostos", "Serviços", "Utilidades", "Receitas"].map((nome, i) => ({ nome, legacy_id: `demo-cat-${i}` })));
const cat = (n) => cats.find((c) => c.nome === n).id;
const subs = await inserir("subcategorias_contas", [
  ["Folha de pagamento", "Salários"], ["Folha de pagamento", "Encargos"], ["Impostos", "DAS"], ["Impostos", "ISS"],
  ["Serviços", "Contabilidade"], ["Serviços", "Software"], ["Utilidades", "Energia"], ["Utilidades", "Internet"], ["Receitas", "Consultoria"],
].map(([c, nome], i) => ({ categoria_id: cat(c), nome, legacy_id: `demo-sub-${i}` })));
const sub = (n) => subs.find((s) => s.nome === n).id;

const contas = [];
let nConta = 0;
const serie = (descricao, tipo, categoria, subcategoria, valor, dia, desdeMes) => {
  const grupo = crypto.randomUUID();
  for (let i = 0; i < 12; i++) {
    const venc = somarMeses(hoje, desdeMes + i, dia);
    const pago = venc < somarDias(hoje, -2);
    contas.push({ descricao, tipo, categoria_id: cat(categoria), subcategoria_id: subcategoria ? sub(subcategoria) : null, valor_base: valor, valor, ajustes: [],
      data_vencimento: iso(venc), status: pago ? "pago" : "pendente", data_pagamento: pago ? iso(venc) : null, banco_pagamento_nome: pago ? "341 · Itaú" : null,
      recorrente: true, grupo_recorrencia: grupo, legacy_id: `demo-ct-${nConta++}` });
  }
};
serie("Aluguel da sede", "pagar", "Aluguel", null, 8500, 10, -6);
serie("Energia elétrica", "pagar", "Utilidades", "Energia", 1240.37, 15, -6);
serie("Internet e telefonia", "pagar", "Utilidades", "Internet", 389.9, 20, -6);
serie("Honorários contábeis", "pagar", "Serviços", "Contabilidade", 2200, 5, -6);
const avulsa = (descricao, tipo, categoria, subcategoria, valor, dias, status, ajustes = []) => {
  const venc = somarDias(hoje, dias);
  let total = valor;
  for (const a of ajustes) { const d = a.modo === "percentual" ? total * a.valor / 100 : a.valor; total = a.tipo === "desconto" ? Math.max(0, total - d) : total + d; }
  contas.push({ descricao, tipo, categoria_id: cat(categoria), subcategoria_id: subcategoria ? sub(subcategoria) : null, valor_base: valor, valor: centavos(total), ajustes,
    data_vencimento: iso(venc), status, data_pagamento: status === "pago" ? iso(venc) : null, banco_pagamento_nome: status === "pago" ? "237 · Bradesco" : null,
    observacao: null, recorrente: false, legacy_id: `demo-ct-${nConta++}` });
};
avulsa("DAS do Simples Nacional", "pagar", "Impostos", "DAS", 6430.12, -12, "pendente", [{ tipo: "multa", modo: "percentual", valor: 2 }, { tipo: "juros", modo: "valor", valor: 64.3 }]);
avulsa("ISS retido a recolher", "pagar", "Impostos", "ISS", 2875.4, -4, "pendente");
avulsa("Licença do sistema de prontuário", "pagar", "Serviços", "Software", 990, 3, "pendente");
avulsa("Salários de novembro", "pagar", "Folha de pagamento", "Salários", 42800, 5, "pendente");
avulsa("FGTS e INSS", "pagar", "Folha de pagamento", "Encargos", 11950.66, 6, "pendente");
avulsa("Consultoria em gestão hospitalar", "receber", "Receitas", "Consultoria", 15000, 2, "pendente");
avulsa("Reembolso de despesas — Hospital São Lucas", "receber", "Receitas", null, 3420.5, -20, "pago");
avulsa("Consultoria — Instituto Cardiológico", "receber", "Receitas", "Consultoria", 9800, 18, "pendente", [{ tipo: "desconto", modo: "percentual", valor: 5 }]);
avulsa("Manutenção do ar-condicionado", "pagar", "Serviços", null, 1450, -35, "pago");
await inserir("contas", contas, "id");

await supabase.auth.signOut();
console.log(JSON.stringify({ empresasContabeis: empresas.length, clientes: clientes.length, prestadores: prestadores.length, vinculos: vinculosClientes.length, registros: registros.length, categorias: cats.length, subcategorias: subs.length, contas: contas.length }));
