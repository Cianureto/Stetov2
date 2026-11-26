import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  cnpjValido,
  cpfValido,
  lerNumeroBR,
  mascararCNPJ,
  mascararCPF,
  mascararTelefone,
  percentualParaInput,
  somenteDigitos,
} from '@/lib/format'
import { REGIME_LABEL, STATUS_CLIENTE_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { type Cliente, useSalvarCliente } from './api'

const percentual = z
  .string()
  .refine((v) => !Number.isNaN(lerNumeroBR(v)), 'Número inválido.')
  .refine((v) => {
    const n = lerNumeroBR(v)
    return n >= 0 && n <= 100
  }, 'Entre 0 e 100.')

const schema = z
  .object({
    tipo_pessoa: z.enum(['PJ', 'PF']),
    documento: z.string(),
    razao_social: z.string().trim().min(2, 'Informe o nome.'),
    regime_tributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real'], {
      error: 'Escolha o regime tributário.',
    }),
    status: z.enum(['ativo', 'inativo', 'provisorio']),
    email: z.union([z.literal(''), z.email('E-mail inválido.')]),
    telefone: z.string(),
    endereco: z.string(),
    aliquota_pis: percentual,
    aliquota_cofins: percentual,
    aliquota_csll: percentual,
    aliquota_ir: percentual,
    aliquota_iss: percentual,
    desconto_padrao_percent: percentual,
  })
  .superRefine((v, ctx) => {
    const ok = v.tipo_pessoa === 'PJ' ? cnpjValido(v.documento) : cpfValido(v.documento)
    if (!ok) ctx.addIssue({ code: 'custom', path: ['documento'], message: v.tipo_pessoa === 'PJ' ? 'CNPJ inválido.' : 'CPF inválido.' })
  })

type FormValues = z.infer<typeof schema>

const VAZIO: FormValues = {
  tipo_pessoa: 'PJ',
  documento: '',
  razao_social: '',
  regime_tributario: undefined as unknown as FormValues['regime_tributario'],
  status: 'ativo',
  email: '',
  telefone: '',
  endereco: '',
  aliquota_pis: '',
  aliquota_cofins: '',
  aliquota_csll: '',
  aliquota_ir: '',
  aliquota_iss: '',
  desconto_padrao_percent: '',
}

function paraForm(c: Cliente): FormValues {
  return {
    tipo_pessoa: c.tipo_pessoa,
    documento: c.tipo_pessoa === 'PJ' ? mascararCNPJ(c.documento) : mascararCPF(c.documento),
    razao_social: c.razao_social,
    regime_tributario: c.regime_tributario ?? VAZIO.regime_tributario,
    status: c.status,
    email: c.email ?? '',
    telefone: c.telefone ? mascararTelefone(c.telefone) : '',
    endereco: c.endereco ?? '',
    aliquota_pis: percentualParaInput(c.aliquota_pis),
    aliquota_cofins: percentualParaInput(c.aliquota_cofins),
    aliquota_csll: percentualParaInput(c.aliquota_csll),
    aliquota_ir: percentualParaInput(c.aliquota_ir),
    aliquota_iss: percentualParaInput(c.aliquota_iss),
    desconto_padrao_percent: percentualParaInput(c.desconto_padrao_percent),
  }
}

const TRIBUTOS = [
  ['aliquota_pis', 'PIS'],
  ['aliquota_cofins', 'COFINS'],
  ['aliquota_csll', 'CSLL'],
  ['aliquota_ir', 'IR'],
  ['aliquota_iss', 'ISS'],
] as const

interface Props {
  aberto: boolean
  onFechar: () => void
  cliente: Cliente | null
}

export function ClienteForm({ aberto, onFechar, cliente }: Props) {
  const salvar = useSalvarCliente()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: VAZIO })

  useEffect(() => {
    if (aberto) reset(cliente ? paraForm(cliente) : VAZIO)
  }, [aberto, cliente, reset])

  const tipo = useWatch({ control, name: 'tipo_pessoa' })

  const onSubmit = async (v: FormValues) => {
    try {
      await salvar.mutateAsync({
        id: cliente?.id,
        dados: {
          tipo_pessoa: v.tipo_pessoa,
          documento: somenteDigitos(v.documento),
          razao_social: v.razao_social.trim(),
          regime_tributario: v.regime_tributario,
          status: v.status,
          email: v.email || null,
          telefone: somenteDigitos(v.telefone) || null,
          endereco: v.endereco.trim() || null,
          aliquota_pis: lerNumeroBR(v.aliquota_pis),
          aliquota_cofins: lerNumeroBR(v.aliquota_cofins),
          aliquota_csll: lerNumeroBR(v.aliquota_csll),
          aliquota_ir: lerNumeroBR(v.aliquota_ir),
          aliquota_iss: lerNumeroBR(v.aliquota_iss),
          desconto_padrao_percent: lerNumeroBR(v.desconto_padrao_percent),
        },
      })
      toast.success(cliente ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      onFechar()
    } catch (e) {
      toast.error('Não foi possível salvar.', { description: (e as Error).message })
    }
  }

  const erro = (campo: keyof FormValues) =>
    errors[campo] ? (
      <p id={`${campo}-erro`} className="text-xs text-destructive">
        {errors[campo]?.message}
      </p>
    ) : null

  const a11y = (campo: keyof FormValues) => ({
    'aria-invalid': !!errors[campo],
    'aria-describedby': errors[campo] ? `${campo}-erro` : undefined,
  })

  return (
    <Sheet open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{cliente ? 'Editar cliente' : 'Novo cliente'}</SheetTitle>
          <SheetDescription>
            As alíquotas abaixo são usadas para calcular os tributos de cada nota deste cliente.
          </SheetDescription>
        </SheetHeader>

        <form id="form-cliente" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Identificação</legend>

            <div className="space-y-1.5">
              <Label>Tipo de pessoa</Label>
              <Controller
                control={control}
                name="tipo_pessoa"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="Tipo de pessoa" className="inline-flex rounded-lg border bg-muted p-0.5">
                    {(['PJ', 'PF'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={field.value === t}
                        onClick={() => {
                          field.onChange(t)
                          setValue('documento', '')
                        }}
                        className={cn(
                          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          field.value === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="documento">{tipo === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                <Controller
                  control={control}
                  name="documento"
                  render={({ field }) => (
                    <Input
                      id="documento"
                      inputMode="numeric"
                      className="tabular"
                      placeholder={tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                      {...a11y('documento')}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(tipo === 'PJ' ? mascararCNPJ(e.target.value) : mascararCPF(e.target.value))}
                    />
                  )}
                />
                {erro('documento')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="razao_social">{tipo === 'PJ' ? 'Razão social' : 'Nome completo'}</Label>
                <Input id="razao_social" {...a11y('razao_social')} {...register('razao_social')} />
                {erro('razao_social')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="regime_tributario">Regime tributário</Label>
                <Controller
                  control={control}
                  name="regime_tributario"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="regime_tributario" className="w-full" {...a11y('regime_tributario')}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REGIME_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {erro('regime_tributario')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Situação</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CLIENTE_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Tributos e desconto</legend>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[...TRIBUTOS, ['desconto_padrao_percent', 'Desconto'] as const].map(([campo, label]) => (
                <div key={campo} className="space-y-1.5">
                  <Label htmlFor={campo} className="text-xs">
                    {label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={campo}
                      inputMode="decimal"
                      placeholder="0"
                      className="tabular pr-6 text-right"
                      {...a11y(campo)}
                      {...register(campo)}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  {erro(campo)}
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-semibold">Contato</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...a11y('email')} {...register('email')} />
                {erro('email')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Controller
                  control={control}
                  name="telefone"
                  render={({ field }) => (
                    <Input
                      id="telefone"
                      inputMode="tel"
                      className="tabular"
                      placeholder="(00) 00000-0000"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(mascararTelefone(e.target.value))}
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register('endereco')} />
            </div>
          </fieldset>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cliente" disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
