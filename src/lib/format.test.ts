import { describe, expect, it } from 'vitest'
import {
  cnpjValido,
  cpfValido,
  formatarDocumento,
  formatarPercentual,
  lerNumeroBR,
  mascararCNPJ,
  mascararCPF,
  mascararTelefone,
} from './format'

describe('máscaras', () => {
  it('CPF progressivo', () => {
    expect(mascararCPF('529')).toBe('529')
    expect(mascararCPF('5299822')).toBe('529.982.2')
    expect(mascararCPF('52998224725')).toBe('529.982.247-25')
    expect(mascararCPF('529.982.247-2599')).toBe('529.982.247-25')
  })
  it('CNPJ progressivo', () => {
    expect(mascararCNPJ('112223')).toBe('11.222.3')
    expect(mascararCNPJ('11222333000181')).toBe('11.222.333/0001-81')
  })
  it('documento escolhe pela quantidade de dígitos', () => {
    expect(formatarDocumento('52998224725')).toBe('529.982.247-25')
    expect(formatarDocumento('11.222.333/0001-81')).toBe('11.222.333/0001-81')
    expect(formatarDocumento('123')).toBe('123')
    expect(formatarDocumento(null)).toBe('')
  })
  it('telefone fixo e celular', () => {
    expect(mascararTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(mascararTelefone('11987654321')).toBe('(11) 98765-4321')
  })
})

describe('validação', () => {
  it('CPF', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('529.982.247-24')).toBe(false)
    expect(cpfValido('111.111.111-11')).toBe(false)
  })
  it('CNPJ', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjValido('11.222.333/0001-80')).toBe(false)
    expect(cnpjValido('00000000000000')).toBe(false)
  })
})

describe('números pt-BR', () => {
  it('lê vírgula, ponto, milhar e símbolo', () => {
    expect(lerNumeroBR('2,5')).toBe(2.5)
    expect(lerNumeroBR('2.5')).toBe(2.5)
    expect(lerNumeroBR('1.234,56')).toBe(1234.56)
    expect(lerNumeroBR('3%')).toBe(3)
    expect(lerNumeroBR('')).toBe(0)
    expect(lerNumeroBR('abc')).toBeNaN()
  })
  it('formata percentual', () => {
    expect(formatarPercentual(0.65)).toBe('0,65%')
    expect(formatarPercentual(5)).toBe('5%')
  })
})
