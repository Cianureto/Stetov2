import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, type AuthState } from '@/lib/auth'
import { routeTree } from './routeTree.gen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

const router = createRouter({
  routeTree,
  context: { auth: undefined!, queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App({ auth }: { auth: AuthState }) {
  // Reavalia os guards de rota quando a sessão muda (login/logout/expiração)
  useEffect(() => {
    router.invalidate()
  }, [auth.session])
  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{(auth) => <App auth={auth} />}</AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
