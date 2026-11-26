import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/pendencias')({
  component: PendenciasPage,
})

function PendenciasPage() {
  return (
    <EmConstrucao
      title="Pendências de clientes"
      description="Clientes com cadastro incompleto ou provisório."
      itens={["Clientes criados por importação que precisam de revisão", "Correção rápida dos dados que faltam"]}
    />
  )
}
