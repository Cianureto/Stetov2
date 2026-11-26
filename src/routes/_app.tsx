import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Loader2, Menu, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Brand } from '@/components/layout/Brand'
import { SidebarNav } from '@/components/layout/Sidebar'
import { UserMenu } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { usePerfil } from '@/lib/perfil'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const perfil = usePerfil()
  const { signOut } = useAuth()

  if (perfil.isPending) {
    return (
      <div className="grid min-h-svh place-items-center" role="status">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Carregando" />
      </div>
    )
  }

  // Logado no Supabase, mas ainda sem vínculo com uma empresa
  if (!perfil.data) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-xs">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold">
            {perfil.isError ? 'Não foi possível carregar seu acesso' : 'Seu acesso ainda não foi liberado'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {perfil.isError
              ? 'Verifique sua conexão e tente de novo.'
              : 'Sua conta existe, mas ainda não está vinculada a uma empresa. Peça ao administrador para liberar seu acesso.'}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {perfil.isError && <Button onClick={() => perfil.refetch()}>Tentar de novo</Button>}
            <Button variant="outline" onClick={() => void signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-svh lg:block">
        <SidebarNav />
      </aside>

      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal</SheetDescription>
          <SidebarNav onNavigate={() => setMenuAberto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <Brand className="lg:hidden" />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
