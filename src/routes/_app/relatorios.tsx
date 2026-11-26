import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/relatorios')({
  component: RelatoriosPage,
})

function RelatoriosPage() {
  return (
    <EmConstrucao
      title="Relatórios"
      description="Análises por período, cliente e prestador."
      itens={["Filtros por período, empresa contábil e situação", "Exportação para Excel", "Resumo do período gerado por IA"]}
    />
  )
}
