import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/contas')({
  component: ContasPage,
})

function ContasPage() {
  return (
    <EmConstrucao
      title="Contas a pagar e receber"
      description="Despesas e recebimentos da empresa."
      itens={["Contas com vencimento, status e banco de pagamento", "Categorias e subcategorias", "Ajustes de valor e contas recorrentes"]}
    />
  )
}
