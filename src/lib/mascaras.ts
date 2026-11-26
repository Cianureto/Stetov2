// Máscaras e validação dos campos com formato conhecido (telefone, e-mail, CEP, CPF, CNPJ). As regras espelham
// api/src/lib/documentos.ts (mantenha os dois em sincronia): o app avisa na hora, a API confere de novo.
// O valor é guardado como o usuário vê (com a máscara); a validação olha só os dígitos.

export type TipoCampo = "telefone" | "email" | "cep" | "cpf" | "cnpj";

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

/** (85) 3224-1234 (fixo) ou (85) 99999-9999 (celular), conforme a quantidade de dígitos; tira o +55. */
export function formatarTelefone(valor: string) {
  let d = somenteDigitos(valor);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  if (resto.length <= 4) return ddd + resto;
  const corte = d.length === 11 ? 5 : 4;
  return `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function formatarCep(valor: string) {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatarCpf(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function formatarCnpj(valor: string) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** DDDs válidos no Brasil (Anatel). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Fixo (10 dígitos, começa em 2–5) ou celular (11 dígitos, começa em 9), com DDD válido; aceita +55. */
export function telefoneValido(valor: string) {
  let d = somenteDigitos(valor);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (!DDDS.has(Number(d.slice(0, 2)))) return false;
  if (d.length === 11) return d[2] === "9";
  if (d.length === 10) return /[2-5]/.test(d[2]);
  return false;
}

export const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
export const cepValido = (valor: string) => /^\d{8}$/.test(somenteDigitos(valor)) && !/^0{8}$/.test(somenteDigitos(valor));

export function cpfValido(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function cnpjValido(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const digito = (ate: number) => {
    const pesos = ate === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = pesos.reduce((t, p, i) => t + Number(d[i]) * p, 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(12) === Number(d[12]) && digito(13) === Number(d[13]);
}

/** Como cada tipo se comporta no campo: máscara, validação, teclado do celular e mensagem de erro. */
export const CAMPOS: Record<TipoCampo, { formatar: (v: string) => string; valido: (v: string) => boolean; inputMode: "tel" | "email" | "numeric"; type: "tel" | "email" | "text"; autoComplete?: string; placeholder: string; maxLength: number; erro: string }> = {
  telefone: { formatar: formatarTelefone, valido: telefoneValido, inputMode: "tel", type: "tel", autoComplete: "tel-national", placeholder: "(85) 99999-9999", maxLength: 15, erro: "Telefone inválido. Use DDD + número, ex.: (85) 99999-9999." },
  email: { formatar: (v) => v.replace(/\s/g, ""), valido: emailValido, inputMode: "email", type: "email", autoComplete: "email", placeholder: "nome@email.com", maxLength: 200, erro: "E-mail inválido. Confira, ex.: nome@email.com." },
  cep: { formatar: formatarCep, valido: cepValido, inputMode: "numeric", type: "text", autoComplete: "postal-code", placeholder: "00000-000", maxLength: 9, erro: "CEP inválido. Use 8 dígitos, ex.: 60000-000." },
  cpf: { formatar: formatarCpf, valido: cpfValido, inputMode: "numeric", type: "text", placeholder: "000.000.000-00", maxLength: 14, erro: "CPF inválido. Confira os números." },
  cnpj: { formatar: formatarCnpj, valido: cnpjValido, inputMode: "numeric", type: "text", placeholder: "00.000.000/0000-00", maxLength: 18, erro: "CNPJ inválido. Confira os números." },
};

/** Mensagem de erro do campo (null = ok). Vazio só é erro quando é obrigatório. */
export function erroDoCampo(tipo: TipoCampo, valor: string, { obrigatorio = false, rotulo }: { obrigatorio?: boolean; rotulo?: string } = {}) {
  if (!valor.trim()) return obrigatorio ? `Informe ${rotulo ? rotulo.toLowerCase() : "este campo"}.` : null;
  return CAMPOS[tipo].valido(valor) ? null : CAMPOS[tipo].erro;
}

/**
 * Confere vários campos antes de enviar o formulário: devolve a primeira mensagem de erro (com o nome do campo)
 * ou null. Use no submit, junto da validação que o formulário já faz.
 */
export function validarCampos(campos: { tipo: TipoCampo; valor: string | null | undefined; rotulo: string; obrigatorio?: boolean }[]) {
  for (const c of campos) {
    const erro = erroDoCampo(c.tipo, c.valor ?? "", { obrigatorio: c.obrigatorio, rotulo: c.rotulo });
    if (erro) return erro.startsWith("Informe") ? erro : `${c.rotulo}: ${erro}`;
  }
  return null;
}
