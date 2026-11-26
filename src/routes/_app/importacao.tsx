import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/importacao')({
  component: ImportacaoPage,
})

function ImportacaoPage() {
  return (
    <EmConstrucao
      title="Importação"
      description="Traga dados de planilhas e XML de NFSe."
      itens={["Importação de planilha com mapeamento de colunas", "Importação de XML de NFSe", "Histórico com linhas importadas, falhas e relatório de erros"]}
    />
  )
}
