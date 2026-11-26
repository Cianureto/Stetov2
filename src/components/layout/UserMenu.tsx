import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { PAPEL_LABEL } from '@/lib/labels'
import { usePerfil } from '@/lib/perfil'

export function UserMenu() {
  const { session, signOut } = useAuth()
  const { data: perfil } = usePerfil()
  const email = session?.user.email ?? ''
  const nome = perfil?.nome || email
  const iniciais = (perfil?.nome ?? email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Menu da conta">
          <Avatar className="size-7">
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {iniciais}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-48 truncate text-sm font-medium sm:inline">{nome}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{nome}</p>
          {perfil?.nome && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          {perfil && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {PAPEL_LABEL[perfil.papel]} · {perfil.empresa?.nome}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
