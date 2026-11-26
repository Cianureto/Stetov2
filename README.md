# Steto v2

Nova versão do Steto Contabilidade, fora da Base44. O frontend e as regras seguem o
[ConectaPRO (visitacao)](https://github.com/mgnroberto/visitacao), adaptados ao Supabase e ao azul e branco da Steto.
As convenções estão em [CLAUDE.md](CLAUDE.md).

- **App:** React 19 + Vite + Tailwind v4 + componentes no estilo Radix/shadcn, react-router.
- **Dados:** Supabase (Postgres, Auth, RLS) no projeto `Steto` (`sa-east-1`). Não há servidor próprio: `src/api/rotas`
  são as "rotas" da API, executadas no navegador contra o Supabase; quem decide o acesso é o RLS.

## Rodar localmente

```bash
cp .env.example .env.local   # URL e chave publicável do Supabase
npm install
npm run dev                  # http://localhost:5173
```

## Checagens (não há CI)

| Comando | O que faz |
|---|---|
| `npm run build` | Tipos (`tsc -b`) + build de produção |
| `npm run lint` | oxlint |
| `npm test` | Vitest + Testing Library (jsdom) |
