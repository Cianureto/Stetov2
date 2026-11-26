import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Hospital, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/layout/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type Cliente, POR_PAGINA, useClientes, useContagemClientes, useExcluirCliente } from '@/features/clientes/api'
import { ClienteForm } from '@/features/clientes/ClienteForm'
import { formatarDocumento, formatarPercentual } from '@/lib/format'
import { REGIME_LABEL, STATUS_CLIENTE_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  busca: z.string().catch('').default(''),
  status: z.enum(['todos', 'ativo', 'inativo', 'provisorio']).catch('todos').default('todos'),
  pagina: z.number().int().min(1).catch(1).default(1),
})

export const Route = createFileRoute('/_app/clientes')({
  validateSearch: searchSchema,
  component: ClientesPage,
})

const TOM_STATUS = { ativo: 'sucesso', inativo: 'neutro', provisorio: 'alerta' } as const
const FILTROS = [
  ['todos', 'Todos'],
  ['ativo', 'Ativos'],
  ['provisorio', 'Provisórios'],
  ['inativo', 'Inativos'],
] as const

function ClientesPage() {
  const filtro = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [busca, setBusca] = useState(filtro.busca)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [excluindo, setExcluindo] = useState<Cliente | null>(null)

  const { data, isPending, isError, isFetching, refetch } = useClientes(filtro)
  const contagem = useContagemClientes()
  const excluir = useExcluirCliente()

  // Busca com atraso de 300 ms para não consultar a cada tecla
  useEffect(() => {
    if (busca === filtro.busca) return
    const t = setTimeout(() => navigate({ search: (s) => ({ ...s, busca, pagina: 1 }), replace: true }), 300)
    return () => clearTimeout(t)
  }, [busca, filtro.busca, navigate])

  const abrirNovo = () => {
    setEditando(null)
    setFormAberto(true)
  }
  const abrirEdicao = (c: Cliente) => {
    setEditando(c)
    setFormAberto(true)
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    try {
      await excluir.mutateAsync(excluindo.id)
      toast.success(`${excluindo.razao_social} foi excluído.`)
    } catch (e) {
      toast.error('Não foi possível excluir.', { description: (e as Error).message })
    } finally {
      setExcluindo(null)
    }
  }

  const total = data?.total ?? 0
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const de = total === 0 ? 0 : (filtro.pagina - 1) * POR_PAGINA + 1
  const ate = Math.min(filtro.pagina * POR_PAGINA, total)
  const temFiltro = !!filtro.busca || filtro.status !== 'todos'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Hospitais e clínicas atendidos, com as alíquotas usadas no cálculo das notas."
        actions={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden /> Novo cliente
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filtrar por situação" className="flex flex-wrap gap-1">
            {FILTROS.map(([valor, label]) => {
              const ativo = filtro.status === valor
              const n = contagem.data?.[valor]
              return (
                <button
                  key={valor}
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => navigate({ search: (s) => ({ ...s, status: valor, pagina: 1 }) })}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    ativo ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {label}
                  {n !== undefined && (
                    <span className={cn('tabular rounded-full px-1.5 text-xs', ativo ? 'bg-primary/10' : 'bg-muted')}>{n}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CNPJ ou CPF"
              aria-label="Buscar clientes"
              className="pl-9"
            />
          </div>
        </div>

        {isError ? (
          <div className="p-10 text-center">
            <p className="font-medium">Não foi possível carregar os clientes.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : !isPending && data.linhas.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
              <Hospital className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 font-semibold">{temFiltro ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {temFiltro
                ? 'Tente outro termo de busca ou mude o filtro de situação.'
                : 'Cadastre o primeiro hospital ou clínica para começar a lançar notas.'}
            </p>
            {!temFiltro && (
              <Button className="mt-5" onClick={abrirNovo}>
                <Plus aria-hidden /> Novo cliente
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('transition-opacity', isFetching && !isPending && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-full pl-4 md:w-auto">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Documento</TableHead>
                  <TableHead className="hidden lg:table-cell">Regime</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">ISS</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Desconto</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 6 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4" colSpan={7}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : data.linhas.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => abrirEdicao(c)}>
                        <TableCell className="w-full max-w-0 pl-4 md:w-auto md:max-w-none">
                          <div className="truncate font-medium">{c.razao_social}</div>
                          <div className="tabular truncate text-xs text-muted-foreground md:hidden">{formatarDocumento(c.documento)}</div>
                        </TableCell>
                        <TableCell className="tabular hidden text-muted-foreground md:table-cell">
                          {formatarDocumento(c.documento)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {c.regime_tributario ? REGIME_LABEL[c.regime_tributario] : '—'}
                        </TableCell>
                        <TableCell className="tabular hidden text-right xl:table-cell">{formatarPercentual(c.aliquota_iss)}</TableCell>
                        <TableCell className="tabular hidden text-right xl:table-cell">
                          {formatarPercentual(c.desconto_padrao_percent)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tom={TOM_STATUS[c.status]}>{STATUS_CLIENTE_LABEL[c.status]}</StatusBadge>
                        </TableCell>
                        <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label={`Ações de ${c.razao_social}`}>
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => abrirEdicao(c)}>
                                <Pencil aria-hidden /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => setExcluindo(c)}>
                                <Trash2 aria-hidden /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {total > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <p className="tabular text-muted-foreground">
                  {de}–{ate} de {total}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Página anterior"
                    disabled={filtro.pagina <= 1}
                    onClick={() => navigate({ search: (s) => ({ ...s, pagina: s.pagina - 1 }) })}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Próxima página"
                    disabled={filtro.pagina >= paginas}
                    onClick={() => navigate({ search: (s) => ({ ...s, pagina: s.pagina + 1 }) })}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ClienteForm aberto={formAberto} onFechar={() => setFormAberto(false)} cliente={editando} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {excluindo?.razao_social}?</AlertDialogTitle>
            <AlertDialogDescription>
              O cadastro e os vínculos com prestadores serão apagados. Isso não pode ser desfeito. Se o cliente
              só parou de ser atendido, prefira mudar a situação para Inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void confirmarExclusao()
              }}
            >
              Excluir cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
