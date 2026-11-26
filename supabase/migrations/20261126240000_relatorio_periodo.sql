-- Relatório do período (tela Relatórios): tudo numa chamada só.
-- Notas canceladas ficam fora de todos os totais (aparecem à parte, em "canceladas").
-- Período anterior = mesmo número de meses imediatamente antes, para as variações.

-- Totais de um intervalo de competências (usado para o período e para o anterior).
create or replace function private.resumo_relatorio(p_de date, p_ate date, p_empresa_contabil uuid)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'quantidade', count(*),
    'valorNf', coalesce(sum(valor_nf), 0),
    'tributos', coalesce(sum(valor_total_tributos), 0),
    'repasse', coalesce(sum(valor_final_repasse), 0),
    'repassePago', coalesce(sum(valor_final_repasse) filter (where situacao = 'pago'), 0),
    'repassePendente', coalesce(sum(valor_final_repasse) filter (where situacao = 'pendente'), 0),
    'pagos', count(*) filter (where situacao = 'pago'),
    'pendentes', count(*) filter (where situacao = 'pendente'),
    'prestadores', count(distinct prestador_id),
    'clientes', count(distinct cliente_id),
    -- dias entre o fim do mês da competência e o pagamento
    'prazoMedioDias', round(avg(data_pagamento - (competencia + interval '1 month' - interval '1 day')::date)
                        filter (where situacao = 'pago' and data_pagamento is not null), 1)
  )
  from public.registros_financeiros
  where situacao <> 'cancelado'
    and competencia between p_de and p_ate
    and (p_empresa_contabil is null or empresa_contabil_id = p_empresa_contabil)
$$;

create or replace function public.relatorio_periodo(p_de date, p_ate date, p_empresa_contabil uuid default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_de date := date_trunc('month', p_de)::date;
  v_ate date := date_trunc('month', p_ate)::date;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_mes_atual date := date_trunc('month', (now() at time zone 'America/Sao_Paulo'))::date;
  v_meses int;
  v_fim date;
  v_ant_de date;
  v_ant_ate date;
  v_resultado jsonb;
begin
  if p_de is null or p_ate is null or v_de > v_ate then
    raise exception 'O início do período vem depois do fim.' using errcode = '22023';
  end if;
  v_meses := ((extract(year from v_ate) - extract(year from v_de)) * 12 + extract(month from v_ate) - extract(month from v_de))::int + 1;
  if v_meses > 60 then
    raise exception 'Escolha um período de até 60 meses.' using errcode = '22023';
  end if;
  v_fim := (v_ate + interval '1 month' - interval '1 day')::date;
  v_ant_ate := (v_de - interval '1 month')::date;
  v_ant_de := (v_de - make_interval(months => v_meses))::date;

  with r as (
    select * from public.registros_financeiros
    where situacao <> 'cancelado'
      and competencia between v_de and v_ate
      and (p_empresa_contabil is null or empresa_contabil_id = p_empresa_contabil)
  ),
  meses as (
    select generate_series(v_de, v_ate, interval '1 month')::date as competencia
  ),
  serie as (
    select m.competencia,
      count(r.id) as quantidade,
      coalesce(sum(r.valor_nf), 0) as valor_nf,
      coalesce(sum(r.valor_total_tributos), 0) as tributos,
      coalesce(sum(r.valor_final_repasse), 0) as repasse,
      coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pago'), 0) as pago,
      coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pendente'), 0) as pendente
    from meses m
    left join r on r.competencia = m.competencia
    group by m.competencia
  ),
  -- Repasses pendentes por idade (meses desde a competência até o mês atual)
  faixas as (
    select case when idade <= 0 then 0 when idade = 1 then 1 when idade = 2 then 2 when idade <= 5 then 3 else 4 end as ordem,
      count(*) as quantidade,
      sum(valor_final_repasse) as valor
    from (
      select valor_final_repasse,
        ((extract(year from v_mes_atual) - extract(year from competencia)) * 12
          + extract(month from v_mes_atual) - extract(month from competencia))::int as idade
      from r where situacao = 'pendente'
    ) p
    group by 1
  ),
  canceladas as (
    select count(*) as quantidade, coalesce(sum(valor_nf), 0) as valor
    from public.registros_financeiros
    where situacao = 'cancelado'
      and competencia between v_de and v_ate
      and (p_empresa_contabil is null or empresa_contabil_id = p_empresa_contabil)
  ),
  c as (
    select ct.valor, ct.tipo, ct.status, ct.data_vencimento, cat.nome as categoria
    from public.contas ct
    left join public.categorias_contas cat on cat.id = ct.categoria_id
    where ct.data_vencimento between v_de and v_fim
      and (p_empresa_contabil is null or ct.empresa_contabil_id = p_empresa_contabil)
  ),
  contas_serie as (
    select m.competencia,
      coalesce(sum(c.valor) filter (where c.tipo = 'pagar'), 0) as pagar,
      coalesce(sum(c.valor) filter (where c.tipo = 'receber'), 0) as receber
    from meses m
    left join c on date_trunc('month', c.data_vencimento)::date = m.competencia
    group by m.competencia
  )
  select jsonb_build_object(
    'periodo', jsonb_build_object('de', v_de, 'ate', v_ate, 'meses', v_meses, 'anteriorDe', v_ant_de, 'anteriorAte', v_ant_ate),
    'atual', private.resumo_relatorio(v_de, v_ate, p_empresa_contabil),
    'anterior', private.resumo_relatorio(v_ant_de, v_ant_ate, p_empresa_contabil),
    'canceladas', (select jsonb_build_object('quantidade', quantidade, 'valorNf', valor) from canceladas),
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'competencia', competencia, 'quantidade', quantidade, 'valorNf', valor_nf, 'tributos', tributos,
        'repasse', repasse, 'repassePago', pago, 'repassePendente', pendente) order by competencia), '[]'::jsonb)
      from serie
    ),
    'tributos', (
      select jsonb_build_object(
        'iss', coalesce(sum(valor_iss), 0), 'ir', coalesce(sum(valor_ir), 0), 'pis', coalesce(sum(valor_pis), 0),
        'cofins', coalesce(sum(valor_cofins), 0), 'csll', coalesce(sum(valor_csll), 0))
      from r
    ),
    'descontos', (
      select jsonb_build_object(
        'padrao', coalesce(sum(desconto_padrao_aplicado), 0), 'adicional', coalesce(sum(desconto_adicional), 0),
        'acrescimo', coalesce(sum(acrescimo), 0))
      from r
    ),
    'envelhecimento', (
      select jsonb_agg(jsonb_build_object('faixa', f.ordem, 'quantidade', coalesce(x.quantidade, 0), 'valor', coalesce(x.valor, 0)) order by f.ordem)
      from generate_series(0, 4) as f(ordem)
      left join faixas x on x.ordem = f.ordem
    ),
    'empresas', (
      select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'nome', coalesce(nullif(e.nome_fantasia, ''), e.razao_social), 'quantidade', g.quantidade, 'valorNf', g.valor_nf, 'repasse', g.repasse) order by g.valor_nf desc), '[]'::jsonb)
      from (
        select empresa_contabil_id, count(*) as quantidade, sum(valor_nf) as valor_nf, sum(valor_final_repasse) as repasse
        from r group by empresa_contabil_id
      ) g
      join public.empresas_contabeis e on e.id = g.empresa_contabil_id
    ),
    'prestadores', (
      select coalesce(jsonb_agg(t order by t."valorNf" desc), '[]'::jsonb)
      from (
        select p.id, p.nome_completo as nome, count(*) as quantidade, sum(r.valor_nf) as "valorNf",
          sum(r.valor_final_repasse) as repasse,
          coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pago'), 0) as "repassePago",
          coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pendente'), 0) as "repassePendente"
        from r join public.prestadores p on p.id = r.prestador_id
        group by p.id, p.nome_completo
        order by 4 desc
        limit 100
      ) t
    ),
    'clientes', (
      select coalesce(jsonb_agg(t order by t."valorNf" desc), '[]'::jsonb)
      from (
        select cl.id, cl.razao_social as nome, count(*) as quantidade, sum(r.valor_nf) as "valorNf",
          sum(r.valor_final_repasse) as repasse,
          coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pago'), 0) as "repassePago",
          coalesce(sum(r.valor_final_repasse) filter (where r.situacao = 'pendente'), 0) as "repassePendente"
        from r join public.clientes cl on cl.id = r.cliente_id
        group by cl.id, cl.razao_social
        order by 4 desc
        limit 100
      ) t
    ),
    'contas', jsonb_build_object(
      'serie', (
        select coalesce(jsonb_agg(jsonb_build_object('competencia', competencia, 'pagar', pagar, 'receber', receber) order by competencia), '[]'::jsonb)
        from contas_serie
      ),
      'resumo', (
        select jsonb_build_object(
          'quantidade', count(*),
          'pagar', coalesce(sum(valor) filter (where tipo = 'pagar'), 0),
          'receber', coalesce(sum(valor) filter (where tipo = 'receber'), 0),
          'pagas', coalesce(sum(valor) filter (where tipo = 'pagar' and status = 'pago'), 0),
          'recebidas', coalesce(sum(valor) filter (where tipo = 'receber' and status = 'pago'), 0),
          'vencidas', count(*) filter (where status <> 'pago' and data_vencimento < v_hoje),
          'valorVencido', coalesce(sum(valor) filter (where status <> 'pago' and data_vencimento < v_hoje), 0))
        from c
      ),
      'categorias', (
        select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'valor', valor, 'quantidade', quantidade) order by valor desc), '[]'::jsonb)
        from (
          select coalesce(categoria, 'Sem categoria') as nome, sum(valor) as valor, count(*) as quantidade
          from c where tipo = 'pagar'
          group by 1 order by 2 desc limit 12
        ) k
      )
    )
  ) into v_resultado;
  return v_resultado;
end $$;

revoke all on function private.resumo_relatorio(date, date, uuid) from public, anon;
grant execute on function private.resumo_relatorio(date, date, uuid) to authenticated;
revoke all on function public.relatorio_periodo(date, date, uuid) from public, anon;
grant execute on function public.relatorio_periodo(date, date, uuid) to authenticated;
