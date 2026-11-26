import { Link } from '@tanstack/react-router'
import { Brand } from './Brand'
import { usePerfil } from '@/lib/perfil'
import { navGroups } from './nav'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: perfil } = usePerfil()
  // Esconde do menu o que o papel não usa. Quem protege os dados é o RLS no banco.
  const grupos = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => !i.acesso || (i.acesso === 'admin' ? perfil?.isAdmin : perfil?.isStetoAdmin),
      ),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Brand inverse />
      </div>
      <nav aria-label="Principal" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {grupos.map((group, i) => (
          <div key={group.label ?? i}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    activeOptions={{ exact: item.to === '/' }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
