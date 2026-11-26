import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <EmConstrucao
      title="Visão geral"
      description="Resumo do mês: faturamento, repasses e o que está pendente."
      itens={["Totais do mês: valor das NFs, tributos e repasses", "Gráfico de evolução mensal", "Últimos registros lançados", "Contas vencendo nos próximos 7 dias"]}
    />
  )
}
