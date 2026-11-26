import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { AuthState } from '@/lib/auth'

export interface RouterContext {
  auth: AuthState
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <TooltipProvider delayDuration={300}>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-svh place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 text-2xl font-semibold">Página não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  ),
})
