import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/empresas-contabeis')({
  component: EmpresasContabeisPage,
})

function EmpresasContabeisPage() {
  return (
    <EmConstrucao
      title="Empresas contábeis"
      description="Empresas pelas quais as notas são emitidas."
      itens={["Lista com busca por CNPJ e razão social", "Cadastro e edição (CNPJ, razão social, nome fantasia, status)", "Detalhes com clientes e prestadores vinculados"]}
    />
  )
}
