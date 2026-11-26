import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/empresas')({
  component: EmpresasPage,
})

function EmpresasPage() {
  return (
    <EmConstrucao
      title="Empresas"
      description="Empresas clientes do Steto (apenas administradores Steto)."
      itens={["Cadastro das empresas que usam o sistema", "Ativar e inativar empresas"]}
    />
  )
}
