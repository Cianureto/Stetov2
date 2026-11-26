-- Steto v2 — suporte às telas: totais calculados no banco, auditoria, parcelas recorrentes,
-- desfazer importação e mesclar cliente provisório.
-- Todas as funções de leitura são security invoker: o RLS de quem chama continua valendo.

-- ── 1. Parcelas recorrentes: um grupo por série (antes era descrição + tipo + categoria) ──
alter table public.contas add column grupo_recorrencia uuid;
create index on public.contas (grupo_recorrencia) where grupo_recorrencia is not null;

-- ── 2. Desfazer importação: cada cadastro lembra a importação que o criou ──
alter table public.clientes add column importacao_id uuid references public.historico_importacoes (id) on delete set null;
alter table public.prestadores add column importacao_id uuid references public.historico_importacoes (id) on delete set null;
alter table public.empresas_contabeis add column importacao_id uuid references public.historico_importacoes (id) on delete set null;
alter table public.registros_financeiros add column importacao_id uuid references public.historico_importacoes (id) on delete set null;
create index on public.clientes (importacao_id) where importacao_id is not null;
create index on public.prestadores (importacao_id) where importacao_id is not null;
create index on public.empresas_contabeis (importacao_id) where importacao_id is not null;
create index on public.registros_financeiros (importacao_id) where importacao_id is not null;

-- ── 3. Trilha de auditoria (só escrita por gatilho; leitura pelo administrador da empresa) ──
create table public.auditoria (
  id bigint generated always as identity primary key,
  empresa_id uuid references public.empresas (id) on delete cascade,
  usuario_id uuid,
  usuario_email text,
  tabela text not null,
  registro_id text,
  acao text not null check (acao in ('criou', 'alterou', 'excluiu')),
  antes jsonb,
  depois jsonb,
  created_at timestamptz not null default now()
);
create index on public.auditoria (empresa_id, created_at desc);
create index on public.auditoria (tabela, registro_id);

create or replace function private.auditar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_antes jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_depois jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_linha jsonb := coalesce(v_depois, v_antes);
begin
  -- Alteração que só mexeu em updated_at não vale registro.
  if tg_op = 'UPDATE' and (v_antes - 'updated_at') = (v_depois - 'updated_at') then
    return new;
  end if;
  insert into public.auditoria (empresa_id, usuario_id, usuario_email, tabela, registro_id, acao, antes, depois)
  values (
    coalesce((v_linha ->> 'empresa_id')::uuid, case when tg_table_name = 'empresas' then (v_linha ->> 'id')::uuid end),
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    tg_table_name,
    coalesce(v_linha ->> 'id', concat_ws(':', v_linha ->> 'prestador_id', v_linha ->> 'cliente_id', v_linha ->> 'empresa_contabil_id')),
    case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'excluiu' end,
    v_antes,
    v_depois
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['empresas','perfis','empresas_contabeis','clientes','prestadores','prestador_clientes',
    'prestador_empresas_contabeis','registros_financeiros','categorias_contas','subcategorias_contas','contas']
  loop
    execute format('create trigger auditar after insert or update or delete on public.%I
      for each row execute function private.auditar()', t);
  end loop;
end $$;

alter table public.auditoria enable row level security;
create policy "auditoria: administrador da empresa lê" on public.auditoria
  for select to authenticated
  using ((select private.sou_admin()) and (empresa_id = (select private.minha_empresa_id()) or (select private.sou_steto_admin())));
revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;

-- ── 4. Totais dos registros financeiros (filtros opcionais) ──
create or replace function public.resumo_registros(
  p_situacao public.situacao_registro default null,
  p_cliente uuid default null,
  p_prestador uuid default null,
  p_empresa_contabil uuid default null,
  p_de date default null,
  p_ate date default null
) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'quantidade', count(*),
    'valorNf', coalesce(sum(valor_nf), 0),
    'tributos', coalesce(sum(valor_total_tributos), 0),
    'repasse', coalesce(sum(valor_final_repasse) filter (where situacao <> 'cancelado'), 0),
    'repassePago', coalesce(sum(valor_final_repasse) filter (where situacao = 'pago'), 0),
    'repassePendente', coalesce(sum(valor_final_repasse) filter (where situacao = 'pendente'), 0),
    'pendentes', count(*) filter (where situacao = 'pendente'),
    'pagos', count(*) filter (where situacao = 'pago'),
    'cancelados', count(*) filter (where situacao = 'cancelado')
  )
  from public.registros_financeiros
  where (p_situacao is null or situacao = p_situacao)
    and (p_cliente is null or cliente_id = p_cliente)
    and (p_prestador is null or prestador_id = p_prestador)
    and (p_empresa_contabil is null or empresa_contabil_id = p_empresa_contabil)
    and (p_de is null or competencia >= date_trunc('month', p_de)::date)
    and (p_ate is null or competencia <= p_ate)
$$;

-- Evolução mês a mês (competência), dos últimos p_meses meses.
create or replace function public.serie_mensal_registros(p_meses int default 12, p_empresa_contabil uuid default null)
returns table (competencia date, quantidade bigint, valor_nf numeric, repasse numeric)
language sql stable security invoker set search_path = '' as $$
  with meses as (
    select generate_series(
      date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date) - make_interval(months => greatest(p_meses, 1) - 1),
      date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date),
      interval '1 month'
    )::date as competencia
  )
  select m.competencia, count(r.id), coalesce(sum(r.valor_nf), 0), coalesce(sum(r.valor_final_repasse) filter (where r.situacao <> 'cancelado'), 0)
  from meses m
  left join public.registros_financeiros r
    on r.competencia = m.competencia and (p_empresa_contabil is null or r.empresa_contabil_id = p_empresa_contabil)
  group by m.competencia
  order by m.competencia
$$;

-- Ranking por prestador ou por cliente (p_por = 'prestador' | 'cliente').
create or replace function public.ranking_registros(
  p_por text,
  p_de date default null,
  p_ate date default null,
  p_empresa_contabil uuid default null,
  p_limite int default 10
) returns table (id uuid, nome text, quantidade bigint, valor_nf numeric, repasse numeric, repasse_pago numeric, repasse_pendente numeric)
language sql stable security invoker set search_path = '' as $$
  select
    case when p_por = 'cliente' then c.id else p.id end,
    case when p_por = 'cliente' then c.razao_social else p.nome_completo end,
    count(*),
    sum(r.valor_nf),
    coalesce(sum(r.valor_final_repasse) filter (where r.situacao <> 'cancelado'), 0),
    coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pago'), 0),
    coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pendente'), 0)
  from public.registros_financeiros r
  join public.clientes c on c.id = r.cliente_id
  join public.prestadores p on p.id = r.prestador_id
  where (p_de is null or r.competencia >= date_trunc('month', p_de)::date)
    and (p_ate is null or r.competencia <= p_ate)
    and (p_empresa_contabil is null or r.empresa_contabil_id = p_empresa_contabil)
  group by 1, 2
  order by 5 desc
  limit least(greatest(p_limite, 1), 100)
$$;

-- ── 5. Totais das contas (vencida = pendente com vencimento antes de hoje, no fuso de Brasília) ──
create or replace function public.resumo_contas(p_de date default null, p_ate date default null)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
  select jsonb_build_object(
    'aPagar', coalesce(sum(valor) filter (where tipo = 'pagar' and status <> 'pago' and (p_de is null or data_vencimento >= p_de) and (p_ate is null or data_vencimento <= p_ate)), 0),
    'aReceber', coalesce(sum(valor) filter (where tipo = 'receber' and status <> 'pago' and (p_de is null or data_vencimento >= p_de) and (p_ate is null or data_vencimento <= p_ate)), 0),
    'pagoNoPeriodo', coalesce(sum(valor) filter (where status = 'pago' and (p_de is null or data_vencimento >= p_de) and (p_ate is null or data_vencimento <= p_ate)), 0),
    'vencidas', count(*) filter (where status <> 'pago' and data_vencimento < (select d from hoje)),
    'valorVencido', coalesce(sum(valor) filter (where status <> 'pago' and data_vencimento < (select d from hoje)), 0),
    'vencemEm7Dias', count(*) filter (where status <> 'pago' and data_vencimento between (select d from hoje) and (select d from hoje) + 7),
    'total', count(*) filter (where (p_de is null or data_vencimento >= p_de) and (p_ate is null or data_vencimento <= p_ate))
  )
  from public.contas
$$;

-- ── 6. Mesclar cliente provisório num cliente existente (registros e vínculos vão junto) ──
create or replace function public.mesclar_cliente(p_origem uuid, p_destino uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_origem = p_destino then
    raise exception 'Escolha outro cliente para mesclar.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.clientes where id = p_destino) then
    raise exception 'Cliente de destino não encontrado.' using errcode = 'P0002';
  end if;
  update public.registros_financeiros set cliente_id = p_destino where cliente_id = p_origem;
  insert into public.prestador_clientes (prestador_id, cliente_id, ativo)
  select prestador_id, p_destino, ativo from public.prestador_clientes where cliente_id = p_origem
  on conflict (prestador_id, cliente_id) do nothing;
  delete from public.clientes where id = p_origem;
  if not found then
    raise exception 'Cliente provisório não encontrado.' using errcode = 'P0002';
  end if;
end $$;

-- ── Permissões das funções ──
do $$
declare f text;
begin
  foreach f in array array[
    'public.resumo_registros(public.situacao_registro, uuid, uuid, uuid, date, date)',
    'public.serie_mensal_registros(int, uuid)',
    'public.ranking_registros(text, date, date, uuid, int)',
    'public.resumo_contas(date, date)',
    'public.mesclar_cliente(uuid, uuid)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function private.auditar() from public, anon, authenticated;
