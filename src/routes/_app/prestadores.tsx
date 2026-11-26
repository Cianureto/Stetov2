import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/prestadores')({
  component: PrestadoresPage,
})

function PrestadoresPage() {
  return (
    <EmConstrucao
      title="Prestadores"
      description="Médicos que recebem os repasses."
      itens={["Lista com busca por nome, CPF e CRM", "Dados bancários e chave Pix", "Vínculo com clientes e empresas contábeis"]}
    />
  )
}
