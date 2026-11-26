import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <EmConstrucao
      title="Clientes"
      description="Hospitais e clínicas atendidos."
      itens={["Lista com filtros por status e regime tributário", "Cadastro PJ/PF com alíquotas de PIS, COFINS, CSLL, IR e ISS", "Desconto padrão e vínculo com prestadores"]}
    />
  )
}
