import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/registros')({
  component: RegistrosPage,
})

function RegistrosPage() {
  return (
    <EmConstrucao
      title="Registros financeiros"
      description="Notas emitidas e cálculo do repasse ao prestador."
      itens={["Lançamento por cliente, prestador, empresa contábil e mês", "Cálculo automático de tributos, descontos e valor final do repasse", "Situação (pendente, pago, cancelado) com atualização em lote"]}
    />
  )
}
