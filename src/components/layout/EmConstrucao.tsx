import { Hammer } from 'lucide-react'
import { PageHeader } from './PageHeader'

export function EmConstrucao({ title, description, itens }: { title: string; description: string; itens: string[] }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-input bg-card p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Hammer className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">Tela em construção</h2>
            <p className="mt-1 text-sm text-muted-foreground">O que vai entrar aqui, trazido do app atual:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {itens.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
