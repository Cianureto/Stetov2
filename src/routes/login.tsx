import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Brand } from '@/components/layout/Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

const ANO = new Date().getFullYear()

const searchSchema = z.object({ redirect: z.string().optional() })

const formSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
type FormValues = z.infer<typeof formSchema>

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.auth.session) throw redirect({ to: search.redirect ?? '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [erro, setErro] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  const onSubmit = async ({ email, password }: FormValues) => {
    setErro(null)
    try {
      await signIn(email, password)
      await navigate({ to: search.redirect ?? '/' })
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Brand inverse />
        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-semibold">
            Repasses, tributos e contas da sua operação médica em um só lugar.
          </h2>
          <p className="mt-4 text-sidebar-foreground">
            Cadastre clientes e prestadores, lance as notas e acompanhe o que está pendente.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">© {ANO} Steto</p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[40px] border-white/5"
        />
      </aside>

      <main className="flex items-center justify-center bg-card px-4 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use o e-mail e a senha cadastrados pela sua empresa.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-erro' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-erro" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'senha-erro' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="senha-erro" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {erro && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
