import { createFileRoute } from '@tanstack/react-router'
import { EmConstrucao } from '@/components/layout/EmConstrucao'

export const Route = createFileRoute('/_app/usuarios')({
  component: UsuariosPage,
})

function UsuariosPage() {
  return (
    <EmConstrucao
      title="Usuários"
      description="Quem acessa o sistema e com qual papel."
      itens={["Convite por e-mail", "Papéis: administrador e usuário", "Vínculo do usuário com a empresa"]}
    />
  )
}
