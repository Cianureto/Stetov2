import type { Enums } from './database.types'

export const REGIME_LABEL: Record<Enums<'regime_tributario'>, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
}

export const STATUS_CLIENTE_LABEL: Record<Enums<'status_cliente'>, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  provisorio: 'Provisório',
}

export const PAPEL_LABEL: Record<Enums<'papel_usuario'>, string> = {
  admin: 'Administrador',
  usuario: 'Usuário',
}
