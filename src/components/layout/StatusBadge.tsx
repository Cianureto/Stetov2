import { cn } from '@/lib/utils'

const TONS = {
  sucesso: 'bg-success-soft text-success ring-success/20',
  alerta: 'bg-warning-soft text-warning ring-warning/25',
  neutro: 'bg-muted text-muted-foreground ring-border',
  info: 'bg-secondary text-secondary-foreground ring-primary/15',
} as const

export function StatusBadge({ tom, children }: { tom: keyof typeof TONS; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONS[tom])}>
      {children}
    </span>
  )
}
