-- Prestadores: cadastro completo calculado no banco e salvamento atômico com vínculos.

alter table public.prestadores
  add column cadastro_completo boolean generated always as (
    coalesce(nome_completo, '') <> '' and coalesce(cpf, '') <> '' and coalesce(telefone, '') <> ''
    and coalesce(email, '') <> '' and coalesce(banco, '') <> '' and coalesce(agencia, '') <> ''
  ) stored;

create index on public.prestadores (empresa_id, cadastro_completo);

-- Salva prestador + vínculos numa transação. security invoker: o RLS do usuário continua valendo.
-- Atualiza os dados bancários só dos registros ainda pendentes (os pagos guardam a conta usada).
create or replace function public.salvar_prestador(
  p_id uuid,
  p_dados jsonb,
  p_clientes uuid[],
  p_empresas_contabeis uuid[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := p_id;
  v_banco_mudou boolean := false;
begin
  if v_id is null then
    insert into public.prestadores (
      nome_completo, cpf, crm, telefone, email, regime_tributario, desconto_padrao_percent,
      banco, agencia, conta, tipo_conta, chave_pix, status
    )
    select r.nome_completo, r.cpf, r.crm, r.telefone, r.email, r.regime_tributario, coalesce(r.desconto_padrao_percent, 0),
           r.banco, r.agencia, r.conta, r.tipo_conta, r.chave_pix, coalesce(r.status, 'ativo')
    from jsonb_populate_record(null::public.prestadores, p_dados) r
    returning id into v_id;
  else
    select (p.banco, p.agencia, p.conta, p.tipo_conta, p.chave_pix)
           is distinct from (r.banco, r.agencia, r.conta, r.tipo_conta, r.chave_pix)
      into v_banco_mudou
    from public.prestadores p, jsonb_populate_record(null::public.prestadores, p_dados) r
    where p.id = v_id;

    update public.prestadores p set
      nome_completo = r.nome_completo, cpf = r.cpf, crm = r.crm, telefone = r.telefone, email = r.email,
      regime_tributario = r.regime_tributario, desconto_padrao_percent = coalesce(r.desconto_padrao_percent, 0),
      banco = r.banco, agencia = r.agencia, conta = r.conta, tipo_conta = r.tipo_conta, chave_pix = r.chave_pix,
      status = coalesce(r.status, 'ativo')
    from jsonb_populate_record(null::public.prestadores, p_dados) r
    where p.id = v_id;
    if not found then
      raise exception 'Prestador não encontrado' using errcode = 'P0002';
    end if;

    if v_banco_mudou then
      update public.registros_financeiros rf set
        banco = p.banco, agencia = p.agencia, conta = p.conta, tipo_conta = p.tipo_conta, chave_pix = p.chave_pix
      from public.prestadores p
      where p.id = v_id and rf.prestador_id = v_id and rf.situacao = 'pendente';
    end if;
  end if;

  delete from public.prestador_clientes
   where prestador_id = v_id and cliente_id <> all (coalesce(p_clientes, '{}'));
  insert into public.prestador_clientes (prestador_id, cliente_id)
  select v_id, unnest(coalesce(p_clientes, '{}'))
  on conflict (prestador_id, cliente_id) do update set ativo = true;

  delete from public.prestador_empresas_contabeis
   where prestador_id = v_id and empresa_contabil_id <> all (coalesce(p_empresas_contabeis, '{}'));
  insert into public.prestador_empresas_contabeis (prestador_id, empresa_contabil_id)
  select v_id, unnest(coalesce(p_empresas_contabeis, '{}'))
  on conflict (prestador_id, empresa_contabil_id) do update set ativo = true;

  return v_id;
end $$;

revoke all on function public.salvar_prestador(uuid, jsonb, uuid[], uuid[]) from public, anon;
grant execute on function public.salvar_prestador(uuid, jsonb, uuid[], uuid[]) to authenticated;
