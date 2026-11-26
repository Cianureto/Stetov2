-- Steto v2 — schema inicial
-- Multiempresa: toda tabela de negócio tem empresa_id e é isolada por RLS.
-- Admin Steto (papel admin numa empresa com is_steto = true) enxerga todas as empresas.
-- legacy_id guarda o id da Base44 para a migração de dados.

create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ── Tipos ───────────────────────────────────────────────────────────────
create type public.papel_usuario as enum ('admin', 'usuario');
create type public.status_ativo as enum ('ativo', 'inativo');
create type public.status_cliente as enum ('ativo', 'inativo', 'provisorio');
create type public.tipo_pessoa as enum ('PJ', 'PF');
create type public.regime_tributario as enum ('simples_nacional', 'lucro_presumido', 'lucro_real');
create type public.tipo_conta_bancaria as enum ('corrente', 'poupanca');
create type public.situacao_registro as enum ('pendente', 'pago', 'cancelado');
create type public.tipo_pagamento as enum ('banco', 'caixa');
create type public.tipo_conta as enum ('pagar', 'receber');
create type public.status_conta as enum ('pendente', 'pago', 'vencido');
create type public.tipo_importacao as enum ('registros_financeiros', 'clientes', 'prestadores', 'empresas_contabeis');
create type public.status_importacao as enum ('sucesso', 'parcial', 'falha');

-- ── updated_at automático ───────────────────────────────────────────────
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Empresas (tenants) e perfis ─────────────────────────────────────────
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  status public.status_ativo not null default 'ativo',
  is_steto boolean not null default false,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index empresas_uma_steto on public.empresas (is_steto) where is_steto;

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id),
  nome text,
  email citext not null,
  papel public.papel_usuario not null default 'usuario',
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.perfis (empresa_id);

-- ── Helpers de acesso (security definer, fora do schema exposto) ────────
create or replace function private.minha_empresa_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select empresa_id from public.perfis where id = (select auth.uid())
$$;

create or replace function private.sou_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select papel = 'admin' from public.perfis where id = (select auth.uid())), false)
$$;

create or replace function private.sou_steto_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select p.papel = 'admin' and e.is_steto
    from public.perfis p join public.empresas e on e.id = p.empresa_id
    where p.id = (select auth.uid())
  ), false)
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ── Cadastros ───────────────────────────────────────────────────────────
create table public.empresas_contabeis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  cnpj text not null,
  razao_social text not null,
  nome_fantasia text,
  status public.status_ativo not null default 'ativo',
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, cnpj)
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  razao_social text not null,
  tipo_pessoa public.tipo_pessoa not null default 'PJ',
  documento text not null, -- CNPJ ou CPF, só dígitos
  email text,
  telefone text,
  endereco text,
  regime_tributario public.regime_tributario,
  aliquota_pis numeric(6,3) not null default 0,
  aliquota_cofins numeric(6,3) not null default 0,
  aliquota_csll numeric(6,3) not null default 0,
  aliquota_ir numeric(6,3) not null default 0,
  aliquota_iss numeric(6,3) not null default 0,
  desconto_padrao_percent numeric(6,3) not null default 0,
  status public.status_cliente not null default 'ativo',
  origem_importacao text,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clientes (empresa_id, razao_social);
create index on public.clientes (empresa_id, documento);

create table public.prestadores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  nome_completo text not null,
  cpf text not null,
  crm text,
  telefone text,
  email text,
  regime_tributario public.regime_tributario,
  desconto_padrao_percent numeric(6,3) not null default 0,
  banco text,
  agencia text,
  conta text,
  tipo_conta public.tipo_conta_bancaria,
  chave_pix text,
  status public.status_ativo not null default 'ativo',
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.prestadores (empresa_id, nome_completo);

create table public.prestador_clientes (
  prestador_id uuid not null references public.prestadores (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (prestador_id, cliente_id)
);
create index on public.prestador_clientes (cliente_id);

create table public.prestador_empresas_contabeis (
  prestador_id uuid not null references public.prestadores (id) on delete cascade,
  empresa_contabil_id uuid not null references public.empresas_contabeis (id) on delete cascade,
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (prestador_id, empresa_contabil_id)
);
create index on public.prestador_empresas_contabeis (empresa_contabil_id);

-- ── Registros financeiros ───────────────────────────────────────────────
create table public.registros_financeiros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  cliente_id uuid not null references public.clientes (id),
  prestador_id uuid not null references public.prestadores (id),
  empresa_contabil_id uuid not null references public.empresas_contabeis (id),
  numero_nfs text,
  competencia date not null check (extract(day from competencia) = 1), -- 1º dia do mês
  data_pagamento date,
  situacao public.situacao_registro not null default 'pendente',
  tipo_pagamento public.tipo_pagamento,
  setor text,
  valor_nf numeric(14,2) not null,
  valor_pis numeric(14,2) not null default 0,
  valor_cofins numeric(14,2) not null default 0,
  valor_csll numeric(14,2) not null default 0,
  valor_ir numeric(14,2) not null default 0,
  valor_iss numeric(14,2) not null default 0,
  valor_total_tributos numeric(14,2) not null default 0,
  aplicar_desconto boolean not null default true,
  desconto_padrao_aplicado numeric(14,2) not null default 0,
  desconto_adicional numeric(14,2) not null default 0,
  desconto_adicional_percent numeric(6,3) not null default 0,
  desconto_total_percent numeric(6,3) not null default 0,
  descontos jsonb not null default '[]'::jsonb,
  acrescimo numeric(14,2) not null default 0,
  valor_ted numeric(14,2) not null default 0,
  valor_antecipacao numeric(14,2) not null default 0,
  valor_devolucao numeric(14,2) not null default 0,
  valor_final_repasse numeric(14,2) not null default 0,
  -- Dados bancários copiados do prestador no momento do lançamento
  banco text,
  agencia text,
  conta text,
  tipo_conta public.tipo_conta_bancaria,
  chave_pix text,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.registros_financeiros (empresa_id, competencia desc);
create index on public.registros_financeiros (cliente_id);
create index on public.registros_financeiros (prestador_id);
create index on public.registros_financeiros (empresa_contabil_id);

-- ── Contas a pagar e receber ────────────────────────────────────────────
create table public.categorias_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  nome text not null,
  ativo boolean not null default true,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table public.subcategorias_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  categoria_id uuid not null references public.categorias_contas (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (categoria_id, nome)
);

create table public.contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  descricao text not null,
  tipo public.tipo_conta not null,
  categoria_id uuid references public.categorias_contas (id) on delete set null,
  subcategoria_id uuid references public.subcategorias_contas (id) on delete set null,
  empresa_contabil_id uuid references public.empresas_contabeis (id) on delete set null,
  valor_base numeric(14,2) not null,
  valor numeric(14,2) not null,
  ajustes jsonb not null default '[]'::jsonb,
  data_vencimento date not null,
  data_pagamento date,
  status public.status_conta not null default 'pendente',
  banco_pagamento_nome text,
  banco_pagamento_codigo text,
  observacao text,
  recorrente boolean not null default false,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.contas (empresa_id, data_vencimento);
create index on public.contas (categoria_id);
create index on public.contas (subcategoria_id);
create index on public.contas (empresa_contabil_id);

-- ── Histórico de importações ────────────────────────────────────────────
create table public.historico_importacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default private.minha_empresa_id() references public.empresas (id),
  tipo public.tipo_importacao not null,
  nome_arquivo text not null,
  total_linhas integer not null,
  importadas integer not null default 0,
  falhadas integer not null default 0,
  novos_cadastros integer not null default 0,
  relatorio_erros text,
  status public.status_importacao not null,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  legacy_id text unique,
  created_at timestamptz not null default now()
);
create index on public.historico_importacoes (empresa_id, created_at desc);

-- ── Triggers updated_at ─────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['empresas','perfis','empresas_contabeis','clientes','prestadores',
    'registros_financeiros','categorias_contas','subcategorias_contas','contas']
  loop
    execute format('create trigger set_updated_at before update on public.%I
      for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public.empresas enable row level security;
alter table public.perfis enable row level security;

create policy "empresas: ver a própria ou todas (admin Steto)" on public.empresas
  for select to authenticated
  using (id = (select private.minha_empresa_id()) or (select private.sou_steto_admin()));
create policy "empresas: só admin Steto altera" on public.empresas
  for all to authenticated
  using ((select private.sou_steto_admin())) with check ((select private.sou_steto_admin()));

create policy "perfis: ver os da própria empresa" on public.perfis
  for select to authenticated
  using (id = (select auth.uid()) or empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin()));
create policy "perfis: admin gerencia os da própria empresa" on public.perfis
  for all to authenticated
  using ((select private.sou_admin()) and (empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin())))
  with check ((select private.sou_admin()) and (empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin())));

-- Tabelas de negócio: qualquer usuário da empresa lê e escreve dentro dela
do $$
declare t text;
begin
  foreach t in array array['empresas_contabeis','clientes','prestadores','prestador_clientes',
    'prestador_empresas_contabeis','registros_financeiros','categorias_contas',
    'subcategorias_contas','contas','historico_importacoes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "isolamento por empresa" on public.%I for all to authenticated
      using (empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin()))
      with check (empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin()))', t);
  end loop;
end $$;

-- ── Permissões da API ───────────────────────────────────────────────────
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Pela API, um perfil só muda nome e papel (e só admin, pela política). Empresa/id não mudam.
revoke update on public.perfis from authenticated;
grant update (nome, papel) on public.perfis to authenticated;

-- ── Seed: a própria Steto ───────────────────────────────────────────────
insert into public.empresas (nome, is_steto) values ('Steto', true);
