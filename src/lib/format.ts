/** Formatação e validação no padrão brasileiro. Funções puras, cobertas por testes. */

export const somenteDigitos = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '')

export function mascararCPF(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

export function mascararCNPJ(v: string) {
  const d = somenteDigitos(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** CPF (11 dígitos) ou CNPJ (14); qualquer outra coisa volta como veio. */
export function formatarDocumento(v: string | null | undefined) {
  const d = somenteDigitos(v)
  if (d.length === 11) return mascararCPF(d)
  if (d.length === 14) return mascararCNPJ(d)
  return (v ?? '').trim()
}

export function mascararTelefone(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

function digitoVerificador(base: string, pesos: number[]) {
  const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cpfValido(v: string) {
  const d = somenteDigitos(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const d1 = digitoVerificador(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digitoVerificador(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return d.endsWith(`${d1}${d2}`)
}

export function cnpjValido(v: string) {
  const d = somenteDigitos(v)
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const d1 = digitoVerificador(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digitoVerificador(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return d.endsWith(`${d1}${d2}`)
}

/** "2,5" / "2.5" / "2,50%" → 2.5. Vazio → 0. Texto inválido → NaN. */
export function lerNumeroBR(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v
  const s = (v ?? '').replace(/[%\sR$]/g, '').trim()
  if (s === '') return 0
  // "1.234,56" → milhar com ponto e decimal com vírgula
  const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  return /^-?\d*\.?\d+$/.test(normalizado) ? Number(normalizado) : Number.NaN
}

const fmtPercent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
export const formatarPercentual = (v: number) => `${fmtPercent.format(v)}%`
/** Valor para exibir dentro de um input ("2,5"), sem o símbolo. */
export const percentualParaInput = (v: number) => (v ? fmtPercent.format(v) : '')

const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatarMoeda = (v: number) => fmtMoeda.format(v)
