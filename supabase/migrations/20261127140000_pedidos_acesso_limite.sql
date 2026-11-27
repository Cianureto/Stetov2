-- Limite de pedidos de acesso (a tela de login é pública). Conta toda tentativa, inclusive as que não viram
-- pedido (e-mail já com conta ou pedido em aberto), para o limite não revelar nada.
--   por IP:     3 por hora e 10 por dia
--   no total:   30 por hora (segura uma enxurrada vinda de vários IPs)
-- Estourou: erro P0429 com a mensagem para a pessoa. O IP vem dos cabeçalhos que o Supabase repassa.

create table private.tentativas_pedido_acesso (
  id bigint generated always as identity primary key,
  ip text not null,
  criado_em timestamptz not null default now()
);
create index on private.tentativas_pedido_acesso (ip, criado_em desc);
create index on private.tentativas_pedido_acesso (criado_em desc);
revoke all on private.tentativas_pedido_acesso from public, anon, authenticated;

create or replace function public.solicitar_acesso(p_nome text, p_email text, p_telefone text default null, p_mensagem text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_cabecalhos json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := coalesce(
    nullif(v_cabecalhos ->> 'cf-connecting-ip', ''),
    nullif(btrim(split_part(v_cabecalhos ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(v_cabecalhos ->> 'x-real-ip', ''),
    'desconhecido'
  );
  v_empresa uuid;
begin
  -- Limpa o que já não conta para limite nenhum (mais de 1 dia).
  delete from private.tentativas_pedido_acesso where criado_em < now() - interval '1 day';

  if (select count(*) from private.tentativas_pedido_acesso where ip = v_ip and criado_em > now() - interval '1 hour') >= 3
     or (select count(*) from private.tentativas_pedido_acesso where ip = v_ip) >= 10 then
    raise exception 'Você já enviou vários pedidos. Tente de novo mais tarde.' using errcode = 'P0429';
  end if;
  if (select count(*) from private.tentativas_pedido_acesso where criado_em > now() - interval '1 hour') >= 30 then
    raise exception 'Muitos pedidos de acesso agora. Tente de novo em alguns minutos.' using errcode = 'P0429';
  end if;

  insert into private.tentativas_pedido_acesso (ip) values (v_ip);

  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    raise exception 'Informe o seu nome.' using errcode = '22023';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or char_length(v_email) > 200 then
    raise exception 'Informe um e-mail válido.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_telefone, '')) > 30 or char_length(coalesce(p_mensagem, '')) > 500 then
    raise exception 'Texto longo demais.' using errcode = '22023';
  end if;

  -- Já tem conta ou já tem pedido em aberto: não faz nada (e não conta isso a quem pediu).
  if exists (select 1 from auth.users u where lower(u.email) = v_email)
     or exists (select 1 from public.solicitacoes_acesso s where s.email = v_email::extensions.citext and s.status = 'pendente') then
    return;
  end if;

  select id into v_empresa from public.empresas where is_steto order by created_at limit 1;
  if v_empresa is null then
    raise exception 'Pedidos de acesso indisponíveis no momento.' using errcode = 'P0001';
  end if;

  insert into public.solicitacoes_acesso (empresa_id, nome, email, telefone, mensagem)
  values (v_empresa, v_nome, v_email, nullif(btrim(p_telefone), ''), nullif(btrim(p_mensagem), ''));
end
$$;

revoke all on function public.solicitar_acesso(text, text, text, text) from public;
grant execute on function public.solicitar_acesso(text, text, text, text) to anon, authenticated;
