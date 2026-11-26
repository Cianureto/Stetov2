# CLAUDE.md

Steto é o sistema contábil de repasses médicos: **clientes** (hospitais e clínicas) recebem notas emitidas por
**empresas contábeis**, com tributos retidos, e o valor líquido é repassado aos **prestadores** (médicos). Código,
identificadores, textos e mensagens estão em **português do Brasil**.

O frontend e as regras seguem o **ConectaPRO** (github.com/mgnroberto/visitacao). Na dúvida sobre um padrão, veja
como o visitacao faz e repita. Diferenças: o backend é o **Supabase direto** (não há API Express), as cores são o
azul e branco da Steto (tokens `--marca*` e `--realce` no lugar de `--petroleo*` e `--menta`) e não há Dokploy.

## Comandos
`npm run dev` (porta 5173), `npm run build` (tsc -b + vite build, a única checagem de tipos), `npm run lint`
(oxlint), `npm test` (Vitest + Testing Library em jsdom; testes ao lado do código, `*.test.ts(x)`).
Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (`.env.local`).

## Arquitetura
- **"API" no navegador:** `src/api/client.ts` tem a mesma interface do ConectaPRO (`api.get/post/patch/put/delete`,
  `ApiError`, `quandoSessaoEncerrar`), mas cada rota é registrada com `rota(metodo, "/recurso/:id", fn)` em
  `src/api/rotas/*.ts` (importadas em `src/api/rotas/index.ts`) e consulta o Supabase. Rotas: validação com
  `validar(schema, corpo)` de `api/validacao.ts` (Zod, `.max()` nas strings), respostas em camelCase (`api/types.ts`),
  erros do Postgres traduzidos por `traduzirErro` (23505 → 409, 42501 → 403…). Rota nova = arquivo em `api/rotas`.
- **Segurança é do banco:** toda tabela de negócio tem `empresa_id` (preenchido pelo default
  `private.minha_empresa_id()`) e RLS por empresa; o administrador da Steto (`empresas.is_steto`) vê todas.
  O app só esconde o que o perfil não permite (`pode`, `usePermissao`, `ComPermissao`, `permissao` no menu).
- **Listas paginadas no banco:** a rota declara `CAMPOS` (lista branca: chave = campo da resposta, `coluna`, `tipo`,
  `busca`), chama `lerConsulta(query, CAMPOS, ordemPadrao)` + `listarNoBanco(() => select(..., {count:"exact"}), c)` de
  `api/listagem.ts` e devolve `{ <lista>, meta }`. Recorte fixo (aba) vai no select. Os totais do cabeçalho vêm de uma
  rota `/recurso/resumo` leve, nunca das linhas.
- **Migrations** em `supabase/migrations/` (SQL versionado). Depois de cada uma, regenere `src/lib/database.types.ts`.
- **Permissões:** catálogo único em `lib/permissoes.ts` (`CATALOGO`). Administrador = acesso total; usuário comum =
  `PERMISSOES_USUARIO`. `empresas.gerenciar` só para o administrador da Steto.
- **Menu:** `lib/navegacao.ts` é a única fonte (seções, `aba` do celular, ações rápidas `ACOES`, trilha, busca ⌘K).

## Padrões do app (iguais ao ConectaPRO)
AppShell (barra lateral escura a partir de `lg`; barra de abas com "+" e "Mais" abaixo), `CabecalhoHero` para telas
com indicadores + `AbasContagem`, tabelas com `useTabelaServidor(caminho, "chave", { ordemPadrao, naUrl: "" })` +
`BarraTabela` + `TabelaDados` (+ `renderCelular`, `onLinha`), ações declaradas como `AcaoTabela<T>[]` com
`useAcoesTabela` e rota `POST /recurso/em-massa`, formulários de cadastro **em tela própria** (`Formulario<X>` com
`MolduraFormulario` + `SecaoFormulario`, grids por container query `@2xl:`; edição via `TelaDoRegistro`; modal só dentro
de outro formulário), `CampoMascara` para CPF/CNPJ/telefone/e-mail, `Seletor` (nunca `<select>`), `useDadosApi` +
`EstadoCarga`, `useAcao` + toast em toda ação, imports absolutos `@/`, arquivos com menos de ~300 linhas, texto
secundário em `text-foreground-muted`, alvos de toque de 44px.
