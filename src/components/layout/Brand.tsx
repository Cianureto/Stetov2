import { Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid size-9 place-items-center rounded-lg',
          inverse ? 'bg-white text-primary' : 'bg-primary text-primary-foreground',
        )}
      >
        <Stethoscope className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className={cn('block text-[15px] font-semibold', inverse ? 'text-white' : 'text-foreground')}>Steto</span>
        <span className={cn('block text-xs', inverse ? 'text-sidebar-muted' : 'text-muted-foreground')}>
          Contabilidade
        </span>
      </span>
    </div>
  )
}
