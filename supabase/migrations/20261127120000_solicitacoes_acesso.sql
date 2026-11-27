-- Pedidos de acesso: quem não tem conta pede pela tela de login; um administrador da empresa aceita (o app
-- cria a conta com senha temporária pela Edge Function) ou recusa. Ninguém cria senha no pedido.

create table public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id),
  nome text not null check (char_length(nome) between 2 and 120),
  email extensions.citext not null check (char_length(email) <= 200),
  telefone text check (telefone is null or char_length(telefone) <= 30),
  mensagem text check (mensagem is null or char_length(mensagem) <= 500),
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz,
  decidido_por uuid references auth.users (id) on delete set null
);
-- Um pedido pendente por e-mail (pedir de novo não duplica).
create unique index solicitacoes_acesso_pendente_email on public.solicitacoes_acesso (email) where status = 'pendente';
create index on public.solicitacoes_acesso (empresa_id, status, criado_em desc);

alter table public.solicitacoes_acesso enable row level security;

-- Só administradores da própria empresa veem e decidem. Ninguém insere direto: o pedido entra pela função.
create policy "admin vê pedidos da empresa" on public.solicitacoes_acesso
  for select to authenticated
  using (empresa_id = private.minha_empresa_id() and private.sou_admin());
create policy "admin decide pedidos da empresa" on public.solicitacoes_acesso
  for update to authenticated
  using (empresa_id = private.minha_empresa_id() and private.sou_admin())
  with check (empresa_id = private.minha_empresa_id() and private.sou_admin());

revoke all on public.solicitacoes_acesso from anon, authenticated;
grant select on public.solicitacoes_acesso to authenticated;
grant update (status, decidido_em, decidido_por) on public.solicitacoes_acesso to authenticated;

-- Pedido feito na tela de login (sem sessão). Responde sempre igual, para não revelar se o e-mail já tem
-- conta ou pedido em aberto. O pedido vai para a empresa Steto (a única que recebe pedidos públicos).
create or replace function public.solicitar_acesso(p_nome text, p_email text, p_telefone text default null, p_mensagem text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_empresa uuid;
begin
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
