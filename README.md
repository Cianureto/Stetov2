# Steto v2

Nova versão do Steto Contabilidade, fora da Base44.

- **Frontend:** React 19 + Vite + TypeScript, TanStack Router (rotas por arquivo em `src/routes`) e TanStack Query, Tailwind v4 + shadcn/ui.
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions), projeto `Steto` em `sa-east-1`.
- **Tema:** padrão da empresa, azul e branco. Os tokens ficam em `src/index.css`.

## Rodar localmente

```bash
cp .env.example .env.local   # preencha URL e chave publicável do Supabase
npm install
npm run dev
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run lint` | oxlint |
| `npm test` | Testes (Vitest) |

## Estrutura

```
src/
  routes/            rotas (login, _app = área logada, _app/* = telas)
  components/layout/ sidebar, cabeçalho, menu do usuário
  components/ui/     componentes shadcn
  lib/               cliente Supabase, autenticação, utilitários
```
