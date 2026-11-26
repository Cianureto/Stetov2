import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Brand } from '@/components/layout/Brand'
import { SidebarNav } from '@/components/layout/Sidebar'
import { UserMenu } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/button'
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
